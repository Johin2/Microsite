'use server'

import { randomUUID } from 'crypto'
import { createServiceSupabaseClient } from './supabase'
import { classifyProject, estimatePlan, generateWorkPlan } from './agents'
import { ProjectBriefSchema, WorkPlanSchema } from './schemas'
import { startRun, runsExhausted } from './devops/runner'

export async function orchestratorStep(projectId) {
  const supabase = createServiceSupabaseClient()
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single()

  if (projectError || !project) {
    throw projectError ?? new Error('Project not found')
  }

  switch (project.status) {
    case 'intake':
      return classifyStage(projectId)
    case 'planning':
      return planningStage(projectId)
    case 'estimated':
      return estimationStage(projectId)
    case 'executing':
      return executingStage(projectId)
    case 'review':
    case 'done':
    case 'blocked':
      return { projectId, status: project.status }
    default:
      return { projectId, status: project.status, notes: 'Unknown status' }
  }
}

async function classifyStage(projectId) {
  const supabase = createServiceSupabaseClient()
  const brief = await latestBrief(projectId)
  const classification = await classifyProject(brief)

  await supabase
    .from('projects')
    .update({
      type: classification.primary,
      status: 'planning',
      updated_at: new Date().toISOString()
    })
    .eq('id', projectId)

  await recordEvent(projectId, 'classification', classification)

  return {
    projectId,
    status: 'planning',
    action: 'classification',
    notes: `Classified as ${classification.primary}`
  }
}

async function planningStage(projectId) {
  const supabase = createServiceSupabaseClient()
  const brief = await latestBrief(projectId)
  const plan = await generateWorkPlan(brief)

  const planId = randomUUID()

  await supabase
    .from('plans')
    .upsert({
      id: planId,
      project_id: projectId,
      milestones: plan.milestones,
      tasks: plan.milestones.flatMap((milestone) => milestone.tasks),
      risks: plan.risks,
      acceptance: plan.acceptance,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })

  await supabase
    .from('projects')
    .update({ status: 'estimated', updated_at: new Date().toISOString() })
    .eq('id', projectId)

  await recordEvent(projectId, 'planning', plan)

  return { projectId, status: 'estimated', action: 'planning' }
}

async function estimationStage(projectId) {
  const supabase = createServiceSupabaseClient()
  const planRow = await loadPlan(projectId)
  const workPlan = WorkPlanSchema.parse({
    projectId,
    milestones: planRow.milestones ?? [],
    risks: planRow.risks ?? [],
    acceptance: planRow.acceptance ?? [],
    successMetrics: []
  })

  const estimates = await estimatePlan(workPlan)

  await supabase
    .from('plans')
    .update({ estimates })
    .eq('id', planRow.id)

  await seedTasksFromPlan(projectId, workPlan, estimates)

  await supabase
    .from('projects')
    .update({ status: 'executing', updated_at: new Date().toISOString() })
    .eq('id', projectId)

  await recordEvent(projectId, 'estimate', estimates)

  return { projectId, status: 'executing', action: 'estimation' }
}

async function executingStage(projectId) {
  const supabase = createServiceSupabaseClient()

  const { data: tasks, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('project_id', projectId)

  if (error) {
    throw error
  }

  if (!tasks || tasks.length === 0) {
    return { projectId, status: 'executing', notes: 'No tasks to execute' }
  }

  const backlogTask = tasks.find((task) => task.status === 'backlog')

  if (backlogTask) {
    const run = await startRun({ taskId: backlogTask.id })
    await supabase
      .from('tasks')
      .update({ status: 'in_progress', updated_at: new Date().toISOString() })
      .eq('id', backlogTask.id)

    await recordEvent(projectId, 'run_update', { runId: run.id, taskId: backlogTask.id, state: 'queued' })

    return {
      projectId,
      status: 'executing',
      action: 'run_started',
      notes: `Started attempt #${run.attempt} for task ${backlogTask.title}`
    }
  }

  const failingTask = tasks.find((task) => task.status === 'blocked')

  if (failingTask) {
    const exhausted = await runsExhausted(failingTask.id)
    if (exhausted) {
      await recordEvent(projectId, 'repair', { taskId: failingTask.id, reason: 'Attempts exhausted' })
      return { projectId, status: 'executing', notes: 'Repair attempts exhausted' }
    }
  }

  const allDone = tasks.every((task) => task.status === 'done' || task.status === 'review')
  if (allDone) {
    await supabase
      .from('projects')
      .update({ status: 'review', updated_at: new Date().toISOString() })
      .eq('id', projectId)

    await recordEvent(projectId, 'tracker', { status: 'review' })

    return { projectId, status: 'review', action: 'completed_tasks' }
  }

  return { projectId, status: 'executing', notes: 'Waiting for CI' }
}

async function latestBrief(projectId) {
  const supabase = createServiceSupabaseClient()

  const [{ data: project }, { data: briefRow }] = await Promise.all([
    supabase
      .from('projects')
      .select('title, type')
      .eq('id', projectId)
      .single(),
    supabase
      .from('briefs')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
  ])

  if (!project) {
    throw new Error('Project not found when loading brief')
  }

  if (!briefRow) {
    throw new Error('Brief not found')
  }

  const scope = Array.isArray(briefRow.scope) ? briefRow.scope : []
  const constraints = Array.isArray(briefRow.constraints) ? briefRow.constraints : []
  const successCriteria = Array.isArray(briefRow.success_criteria) ? briefRow.success_criteria : []
  const attachments = Array.isArray(briefRow.attachments) ? briefRow.attachments : []

  return ProjectBriefSchema.parse({
    projectId,
    title: project.title,
    summary: briefRow.summary ?? '',
    scope,
    constraints,
    successCriteria,
    categoryGuess: project.type ?? undefined,
    attachments
  })
}

async function loadPlan(projectId) {
  const supabase = createServiceSupabaseClient()
  const { data, error } = await supabase
    .from('plans')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error || !data) {
    throw error ?? new Error('Plan not found')
  }

  return data
}

async function seedTasksFromPlan(projectId, plan, estimates) {
  const supabase = createServiceSupabaseClient()

  const { data: existing } = await supabase
    .from('tasks')
    .select('id')
    .eq('project_id', projectId)

  const existingTaskIds = new Set(existing?.map((row) => row.id) ?? [])

  const estimatesByTask = new Map()
  estimates.tasks.forEach((item) => {
    estimatesByTask.set(item.taskId, item)
  })

  const rows = plan.milestones.flatMap((milestone) =>
    milestone.tasks.map((task) => {
      const taskId = task.id || randomUUID()
      const estimate = estimatesByTask.get(taskId)
      return {
        id: taskId,
        project_id: projectId,
        title: task.title,
        description: task.description ?? null,
        status: 'backlog',
        assignee: null,
        labels: [],
        acceptance: task.acceptance,
        estimate_hours: estimate?.likelyHours ?? null,
        depends_on: task.dependencies,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    })
  )

  const newRows = rows.filter((row) => !existingTaskIds.has(row.id))

  if (newRows.length > 0) {
    await supabase.from('tasks').insert(newRows)
    await recordEvent(projectId, 'task_update', { inserted: newRows.length })
  }
}

async function recordEvent(projectId, kind, payload) {
  const supabase = createServiceSupabaseClient()
  await supabase.from('events').insert({
    id: randomUUID(),
    project_id: projectId,
    kind,
    payload,
    created_at: new Date().toISOString()
  })
}
