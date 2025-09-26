import { randomUUID } from 'crypto'

import { createServiceSupabaseClient } from '@lib/supabase'

const SUBMISSION_STATUS = new Set(['pending', 'accepted', 'rejected'])

const memoryStore = {
  submissions: [],
}

let supabaseHealthy = true

function markSupabaseFailure(error) {
  if (supabaseHealthy) {
    supabaseHealthy = false
    console.warn('[submissions] Falling back to in-memory store. Reason:', error?.message ?? error)
  }
}

function getSupabaseClient() {
  if (!supabaseHealthy) return null
  try {
    return createServiceSupabaseClient()
  } catch (error) {
    markSupabaseFailure(error)
    return null
  }
}

function mapProject(row) {
  if (!row) return null

  const brief = Array.isArray(row.briefs) && row.briefs.length > 0 ? row.briefs[0] : null
  const scope = (brief && typeof brief.scope === 'object' && brief.scope) || {}
  const references = Array.isArray(scope.references)
    ? scope.references.filter((item) => item && typeof item === 'object')
    : []

  return {
    id: row.id,
    name: row.project_title ?? row.title ?? 'Untitled engagement',
    email: row.owner_email ?? scope.email ?? null,
    status: row.status ?? 'pending',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    details: brief?.summary ?? row.details ?? '',
    metadata: {
      clientName: scope.clientName ?? null,
      company: scope.company ?? null,
      phone: scope.phone ?? null,
      projectTitle: scope.projectTitle ?? row.project_title ?? row.title ?? null,
      projectType: scope.projectType ?? row.type ?? null,
      timeline: scope.timeline ?? null,
      budget: scope.budget ?? null,
      keyMoment: row.key_moment ?? scope.keyMoment ?? row.due_date ?? null,
      additionalNotes: scope.additionalNotes ?? null,
      referralSource: scope.referralSource ?? null,
      references,
    },
  }
}

export async function listSubmissions() {
  const supabase = getSupabaseClient()
  if (supabase) {
    const { data, error } = await supabase
      .from('projects')
      .select(
        `id, title, owner_email, status, type, due_date, created_at, updated_at,
         briefs(summary, scope)`
      )
      .in('status', ['pending', 'accepted', 'rejected'])
      .order('created_at', { ascending: false })

    if (!error) {
      return (data ?? []).map((row) => mapProject({ ...row, key_moment: row.due_date }))
    }

    if (error?.code === 'PGRST205') {
      markSupabaseFailure(error)
    } else {
      console.error('Failed to list submissions', error)
      return []
    }
  }

  return [...memoryStore.submissions]
}

export async function findSubmission(id) {
  const supabase = getSupabaseClient()
  if (supabase) {
    const { data, error } = await supabase
      .from('projects')
      .select(`id, title, owner_email, status, type, due_date, created_at, updated_at, briefs(summary, scope)`)
      .eq('id', id)
      .single()

    if (!error) {
      return mapProject({ ...data, key_moment: data?.due_date })
    }

    if (error?.code === 'PGRST205') {
      markSupabaseFailure(error)
    } else if (error?.code === 'PGRST116' || error?.details?.includes('Results contain 0 rows')) {
      return null
    } else {
      console.error('Failed to find submission', error)
      return null
    }
  }

  return memoryStore.submissions.find((item) => item.id === id) ?? null
}

export async function createSubmission(input) {
  const supabase = getSupabaseClient()
  if (supabase) {
    const projectId = randomUUID()

    const projectTitle = input.projectTitle || input.name || 'Untitled engagement'
    const projectType = input.projectType || 'intake'
    const keyMoment = input.keyMoment ? new Date(input.keyMoment).toISOString() : null

    const { error: projectError } = await supabase.from('projects').insert({
      id: projectId,
      title: projectTitle,
      owner_email: input.email,
      status: 'pending',
      type: projectType,
      due_date: keyMoment,
      priority: 3,
    })

    if (projectError) {
      if (projectError.code === 'PGRST205') {
        markSupabaseFailure(projectError)
      } else {
        console.error('Failed to insert project', projectError)
        throw projectError
      }
    } else {
      const scope = {
        clientName: input.clientName ?? null,
        company: input.company ?? null,
        email: input.email ?? null,
        phone: input.phone ?? null,
        projectTitle,
        projectType,
        timeline: input.timeline ?? null,
        budget: input.budget ?? null,
        keyMoment,
        additionalNotes: input.additionalNotes ?? null,
        referralSource: input.referralSource ?? null,
        references: input.references ?? [],
      }

      const { error: briefError } = await supabase.from('briefs').insert({
        id: randomUUID(),
        project_id: projectId,
        summary: input.projectDescription ?? input.details ?? '',
        scope,
        constraints: {},
        success_criteria: {},
      })

      if (briefError) {
        console.error('Failed to insert brief', briefError)
        throw briefError
      }

      return findSubmission(projectId)
    }
  }

  const now = new Date().toISOString()
  const record = {
    id: randomUUID(),
    name: input.projectTitle || input.name || 'Untitled engagement',
    email: input.email,
    status: 'pending',
    createdAt: now,
    updatedAt: now,
    details: input.projectDescription ?? input.details ?? '',
    metadata: {
      clientName: input.clientName ?? null,
      company: input.company ?? null,
      phone: input.phone ?? null,
      projectTitle: input.projectTitle ?? input.name ?? null,
      projectType: input.projectType ?? 'intake',
      timeline: input.timeline ?? null,
      budget: input.budget ?? null,
      keyMoment: input.keyMoment ?? null,
      additionalNotes: input.additionalNotes ?? null,
      referralSource: input.referralSource ?? null,
      references: input.references ?? [],
    },
  }

  memoryStore.submissions.unshift(record)
  return record
}

export async function updateSubmissionStatus(id, status) {
  if (!SUBMISSION_STATUS.has(status)) {
    throw new Error('Invalid status update')
  }

  const supabase = getSupabaseClient()
  if (supabase) {
    const { error } = await supabase.from('projects').update({ status }).eq('id', id)

    if (!error) {
      return findSubmission(id)
    }

    if (error.code === 'PGRST205') {
      markSupabaseFailure(error)
    } else {
      console.error('Failed to update submission status', error)
      throw error
    }
  }

  const submission = memoryStore.submissions.find((item) => item.id === id)
  if (!submission) return null
  submission.status = status
  submission.updatedAt = new Date().toISOString()
  return submission
}
