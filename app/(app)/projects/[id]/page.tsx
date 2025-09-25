import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createServiceSupabaseClient } from '@lib/supabase'
import { ProjectTypeBadge } from '@components/ProjectTypeBadge'
import { StatusPill } from '@components/StatusPill'
import { PlanTree } from '@components/PlanTree'
import { TaskBoard } from '@components/TaskBoard'
import { RunTimeline } from '@components/RunTimeline'
import { NextStepButton } from '@components/NextStepButton'
import { TrackerTaskSchema, MilestoneSchema } from '@lib/schemas'
import { z } from 'zod'

type TrackerTask = z.infer<typeof TrackerTaskSchema>
type Milestone = z.infer<typeof MilestoneSchema>

export default async function ProjectPage({ params }: { params: { id: string } }) {
  const supabase = createServiceSupabaseClient()

  const { data: project } = await supabase.from('projects').select('*').eq('id', params.id).single()

  if (!project) {
    notFound()
  }

  const [{ data: brief }, { data: plan }, { data: tasks }] = await Promise.all([
    supabase
      .from('briefs')
      .select('*')
      .eq('project_id', params.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('plans')
      .select('*')
      .eq('project_id', params.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('tasks')
      .select('*')
      .eq('project_id', params.id)
      .order('created_at', { ascending: true })
  ])

  const taskIds = (tasks ?? []).map((task) => task.id)
  const { data: runs } = taskIds.length
    ? await supabase.from('runs').select('*').in('task_id', taskIds).order('created_at', { ascending: true })
    : { data: [] as any[] }

  const milestoneData: Milestone[] = Array.isArray(plan?.milestones)
    ? (plan?.milestones as Milestone[])
    : []
  const taskData: TrackerTask[] = (tasks ?? []).map((task) => ({
    id: task.id,
    projectId: task.project_id,
    title: task.title,
    description: task.description,
    status: task.status,
    assignee: task.assignee ?? undefined,
    labels: task.labels ?? [],
    estimateHours: task.estimate_hours ?? undefined,
    dependsOn: task.depends_on ?? [],
    acceptance: task.acceptance ?? [],
    updatedAt: task.updated_at ?? undefined
  }))

  const runData = (runs ?? []).map((run) => ({
    id: run.id,
    taskId: run.task_id,
    state: run.state,
    attempt: run.attempt,
    branch: run.branch,
    prUrl: run.pr_url,
    ciUrl: run.ci_url,
    previewUrl: run.preview_url,
    logs: run.logs,
    result: run.result,
    createdAt: run.created_at,
    updatedAt: run.updated_at
  }))

  return (
    <div className="space-y-12">
      <section className="flex flex-wrap items-center justify-between gap-6">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-semibold text-white">{project.title}</h1>
            <ProjectTypeBadge type={project.type} />
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
            <StatusPill status={project.status} />
            {project.owner_email ? <span>Owner: {project.owner_email}</span> : null}
            {project.due_date ? <span>Due {new Date(project.due_date).toLocaleDateString()}</span> : null}
          </div>
        </div>
        <div className="flex gap-3 text-sm">
          <Link href={`/(app)/projects/${params.id}/plan`} className="rounded-lg border border-slate-800 px-4 py-2 text-slate-300 hover:text-white">
            View Plan
          </Link>
          {taskData[0] ? (
            <Link href={`/(app)/tasks/${taskData[0].id}`} className="rounded-lg border border-slate-800 px-4 py-2 text-slate-300 hover:text-white">
              First Task
            </Link>
          ) : null}
          <NextStepButton projectId={params.id} />
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <article className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
          <h2 className="text-lg font-semibold text-white">Project Brief</h2>
          <dl className="mt-4 space-y-4 text-sm text-slate-300">
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-500">Summary</dt>
              <dd className="mt-1 whitespace-pre-wrap text-sm text-slate-300">{brief?.summary ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-500">Scope</dt>
              <dd className="mt-1">
                <ul className="space-y-1">
                  {Array.isArray(brief?.scope) && brief?.scope.length
                    ? (brief?.scope as string[]).map((item) => (
                        <li key={item}>• {item}</li>
                      ))
                    : '—'}
                </ul>
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-500">Constraints</dt>
              <dd className="mt-1">
                <ul className="space-y-1">
                  {Array.isArray(brief?.constraints) && brief?.constraints.length
                    ? (brief?.constraints as string[]).map((item) => (
                        <li key={item}>• {item}</li>
                      ))
                    : '—'}
                </ul>
              </dd>
            </div>
          </dl>
        </article>

        <article className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
          <h2 className="text-lg font-semibold text-white">Risks</h2>
          <ul className="mt-4 space-y-3 text-sm text-slate-300">
            {Array.isArray(plan?.risks) && plan?.risks.length
              ? (plan?.risks as string[]).map((risk) => (
                  <li key={risk} className="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
                    ⚠️ {risk}
                  </li>
                ))
              : (
                <li className="text-sm text-slate-500">No risks recorded yet.</li>
                )}
          </ul>
        </article>
      </section>

      <section className="space-y-5">
        <header className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Plan Overview</h2>
          <Link href={`/(app)/projects/${params.id}/plan`} className="text-sm text-primary">
            Manage Plan →
          </Link>
        </header>
        <PlanTree milestones={milestoneData} />
      </section>

      <section className="space-y-5">
        <header className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Task Board</h2>
          <Link href={`/(app)/projects/${params.id}/plan`} className="text-sm text-primary">
            Edit Tasks
          </Link>
        </header>
        <TaskBoard tasks={taskData} />
      </section>

      <section className="space-y-5">
        <h2 className="text-lg font-semibold text-white">Run Timeline</h2>
        <RunTimeline runs={runData as any} />
      </section>
    </div>
  )
}
