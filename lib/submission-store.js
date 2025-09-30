import { randomUUID } from 'crypto'

import { createServiceSupabaseClient } from '@lib/supabase'

const SUBMISSION_STATUS = new Set(['pending', 'accepted', 'rejected'])

const memoryStore = {
  submissions: []
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

function stringOrNull(value) {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length ? trimmed : null
}

function normalizeDateish(value) {
  if (!value) return null
  if (value instanceof Date) {
    const timestamp = value.getTime()
    return Number.isNaN(timestamp) ? null : value.toISOString()
  }
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return null
    const parsed = new Date(trimmed)
    if (Number.isNaN(parsed.getTime())) {
      return trimmed
    }
    return trimmed.length === 10 ? trimmed : parsed.toISOString()
  }
  return null
}

function toIsoDate(value) {
  if (!value) return null
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) {
    return null
  }
  return date.toISOString()
}

function sanitizeReferences(value) {
  if (!Array.isArray(value)) return []

  return value
    .map((item, index) => {
      if (!item) return null

      if (typeof item === 'string') {
        const url = item.trim()
        if (!url) return null
        return { url, name: `Reference ${index + 1}` }
      }

      if (typeof item === 'object') {
        const rawUrl = typeof item.url === 'string' ? item.url.trim() : ''
        if (!rawUrl) return null
        const label =
          (typeof item.name === 'string' && item.name.trim()) ||
          (typeof item.title === 'string' && item.title.trim()) ||
          rawUrl
        return { url: rawUrl, name: label }
      }

      return null
    })
    .filter(Boolean)
}

function sanitizeMetadata(input = {}) {
  const metadata = {
    clientName: stringOrNull(input.clientName) ?? null,
    company: stringOrNull(input.company) ?? null,
    phone: stringOrNull(input.phone) ?? null,
    projectTitle: stringOrNull(input.projectTitle) ?? null,
    projectType: stringOrNull(input.projectType) ?? null,
    timeline: stringOrNull(input.timeline) ?? null,
    budget: stringOrNull(input.budget) ?? null,
    keyMoment: normalizeDateish(input.keyMoment),
    additionalNotes: stringOrNull(input.additionalNotes) ?? null,
    referralSource: stringOrNull(input.referralSource) ?? null,
    references: sanitizeReferences(input.references)
  }

  return metadata
}

function cloneMetadata(metadata = {}) {
  const references = Array.isArray(metadata.references)
    ? metadata.references.map((item) => (item ? { ...item } : null)).filter(Boolean)
    : []

  return {
    ...metadata,
    references
  }
}

function persistSubmissionToMemory({ id, email, summary, metadata, projectTitle }) {
  const recordId = id ?? randomUUID()
  const now = new Date().toISOString()
  const record = {
    id: recordId,
    projectId: recordId,
    name: projectTitle,
    email,
    status: 'pending',
    createdAt: now,
    updatedAt: now,
    details: summary,
    metadata: cloneMetadata(metadata)
  }

  memoryStore.submissions.unshift(record)
  return record
}

function mapProject(row) {
  if (!row) return null

  const brief = Array.isArray(row.briefs) && row.briefs.length > 0 ? row.briefs[0] : null
  const scope = (brief && typeof brief.scope === 'object' && brief.scope) || {}
  const metadata = sanitizeMetadata({
    ...scope,
    projectTitle: scope.projectTitle ?? row.project_title ?? row.title ?? null,
    projectType: scope.projectType ?? row.type ?? null,
    keyMoment: row.key_moment ?? scope.keyMoment ?? row.due_date ?? null,
    references: scope.references ?? []
  })

  const name = metadata.projectTitle ?? row.title ?? 'Untitled engagement'
  const email = row.owner_email ?? scope.email ?? null

  return {
    id: row.id,
    projectId: row.id,
    name,
    email,
    status: row.status ?? 'pending',
    createdAt: row.created_at ?? null,
    updatedAt: row.updated_at ?? null,
    details: brief?.summary ?? row.details ?? '',
    metadata: {
      ...metadata,
      projectTitle: metadata.projectTitle ?? name,
      email: email ?? null
    }
  }
}

function mapSubmissionRow(row) {
  if (!row) return null

  const metadata = sanitizeMetadata(row.metadata ?? {})
  const projectId = row.project_id ?? row.id ?? null
  const name = metadata.projectTitle ?? row.name ?? 'Untitled engagement'
  const email = row.email ?? metadata.email ?? null

  return {
    id: projectId ?? row.id,
    projectId,
    name,
    email,
    status: row.status ?? 'pending',
    createdAt: row.created_at ?? null,
    updatedAt: row.updated_at ?? null,
    details: row.details ?? '',
    metadata: {
      ...metadata,
      projectTitle: metadata.projectTitle ?? name
    }
  }
}

function isMissingRelationError(error) {
  if (!error) return false
  if (error.code === '42P01' || error.code === 'PGRST204' || error.code === 'PGRST201' || error.code === 'PGRST205') {
    return true
  }
  const message = `${error.message ?? ''} ${error.details ?? ''}`.toLowerCase()
  return message.includes('does not exist') || message.includes('missing') || message.includes('relation')
}

async function listProjectsFallback(supabase) {
  const { data, error } = await supabase
    .from('projects')
    .select(
      `id, title, owner_email, status, type, due_date, created_at, updated_at,
       briefs(summary, scope)`
    )
    .in('status', ['pending', 'accepted', 'rejected'])
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Failed to list submissions from projects', error)
    return []
  }

  return (data ?? []).map((row) => mapProject({ ...row, key_moment: row.due_date }))
}

async function loadSubmissionFromProjects(supabase, projectId) {
  const { data, error } = await supabase
    .from('projects')
    .select('id, title, owner_email, status, type, due_date, created_at, updated_at, briefs(summary, scope)')
    .eq('id', projectId)
    .maybeSingle()

  if (error) {
    if (!isMissingRelationError(error)) {
      console.error('Failed to load submission from projects', error)
    }
    return null
  }

  if (!data) return null
  return mapProject({ ...data, key_moment: data?.due_date })
}

async function cleanupFailedProject(supabase, projectId) {
  if (!supabase || !projectId) return

  const { error: briefDeleteError } = await supabase.from('briefs').delete().eq('project_id', projectId)
  if (briefDeleteError && !isMissingRelationError(briefDeleteError)) {
    console.error('Failed to clean up brief after submission error', briefDeleteError)
  }

  const { error: projectDeleteError } = await supabase.from('projects').delete().eq('id', projectId)
  if (projectDeleteError && !isMissingRelationError(projectDeleteError)) {
    console.error('Failed to clean up project after submission error', projectDeleteError)
  }
}

export async function listSubmissions() {
  const supabase = getSupabaseClient()
  if (supabase) {
    const { data, error } = await supabase
      .from('intake_submissions')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error) {
      return (data ?? []).map((row) => mapSubmissionRow(row))
    }

    if (isMissingRelationError(error)) {
      return listProjectsFallback(supabase)
    }

    console.error('Failed to list intake submissions', error)
    return []
  }

  return [...memoryStore.submissions]
}

export async function findSubmission(id) {
  const supabase = getSupabaseClient()
  if (supabase) {
    const { data, error } = await supabase
      .from('intake_submissions')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (!error) {
      return mapSubmissionRow(data)
    }

    if (isMissingRelationError(error)) {
      return loadSubmissionFromProjects(supabase, id)
    }

    if (error?.code === 'PGRST116' || error?.details?.includes('Results contain 0 rows')) {
      return null
    }

    console.error('Failed to find submission', error)
    return null
  }

  return memoryStore.submissions.find((item) => item.id === id) ?? null
}

export async function createSubmission(input) {
  const supabase = getSupabaseClient()
  const sanitizedMetadata = sanitizeMetadata({
    clientName: input.clientName,
    company: input.company,
    phone: input.phone,
    projectTitle: input.projectTitle ?? input.name ?? null,
    projectType: input.projectType ?? input.categoryHint ?? null,
    timeline: input.timeline,
    budget: input.budget,
    keyMoment: input.keyMoment ?? input.dueDate ?? null,
    additionalNotes: input.additionalNotes,
    referralSource: input.referralSource,
    references: input.references
  })

  const projectTitle = sanitizedMetadata.projectTitle ?? input.projectTitle ?? input.name ?? 'Untitled engagement'
  const projectType = sanitizedMetadata.projectType ?? input.projectType ?? input.categoryHint ?? 'intake'
  const summary = input.projectDescription ?? input.details ?? ''
  const dueDateIso = sanitizedMetadata.keyMoment ? toIsoDate(sanitizedMetadata.keyMoment) : null

  sanitizedMetadata.projectTitle = projectTitle
  sanitizedMetadata.projectType = projectType

  const memoryPayload = {
    email: input.email,
    summary,
    metadata: sanitizedMetadata,
    projectTitle
  }

  if (supabase) {
    const projectId = randomUUID()

    const { error: projectError } = await supabase.from('projects').insert({
      id: projectId,
      title: projectTitle,
      owner_email: input.email,
      status: 'pending',
      type: projectType,
      due_date: dueDateIso,
      priority: 3
    })

    if (projectError) {
      if (isMissingRelationError(projectError)) {
        console.warn('Projects table unavailable; storing submission in memory.', projectError.message)
        markSupabaseFailure(projectError)
      } else {
        console.error('Failed to insert project', projectError)
      }
      return persistSubmissionToMemory({ ...memoryPayload, id: projectId })
    }

    const { error: briefError } = await supabase.from('briefs').insert({
      id: randomUUID(),
      project_id: projectId,
      summary,
      scope: {
        ...sanitizedMetadata,
        email: input.email ?? null
      },
      constraints: {},
      success_criteria: {}
    })

    if (briefError) {
      if (isMissingRelationError(briefError)) {
        console.warn('Briefs table unavailable; falling back to memory store.', briefError.message)
        markSupabaseFailure(briefError)
      } else {
        console.error('Failed to insert brief', briefError)
      }
      await cleanupFailedProject(supabase, projectId)
      return persistSubmissionToMemory({ ...memoryPayload, id: projectId })
    }

    const { data: submissionRow, error: submissionError } = await supabase
      .from('intake_submissions')
      .insert({
        id: projectId,
        project_id: projectId,
        name: projectTitle,
        email: input.email,
        status: 'pending',
        details: summary,
        metadata: sanitizedMetadata
      })
      .select()
      .single()

    if (submissionError) {
      if (isMissingRelationError(submissionError)) {
        console.warn('intake_submissions table unavailable; falling back to projects view.', submissionError.message)
        return loadSubmissionFromProjects(supabase, projectId)
      }

      console.error('Failed to insert intake submission', submissionError)
      await cleanupFailedProject(supabase, projectId)
      return persistSubmissionToMemory({ ...memoryPayload, id: projectId })
    }

    return mapSubmissionRow(submissionRow)
  }

  return persistSubmissionToMemory(memoryPayload)
}

export async function updateSubmissionStatus(id, status) {
  if (!SUBMISSION_STATUS.has(status)) {
    throw new Error('Invalid status update')
  }

  const supabase = getSupabaseClient()
  if (supabase) {
    const { error } = await supabase.from('projects').update({ status }).eq('id', id)

    if (!error) {
      const { error: syncError } = await supabase
        .from('intake_submissions')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id)

      if (syncError && !isMissingRelationError(syncError)) {
        console.error('Failed to sync intake submission status', syncError)
      }

      return findSubmission(id)
    }

    if (isMissingRelationError(error)) {
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

export async function listSubmissionsByEmail(email) {
  const supabase = getSupabaseClient()
  const safeEmail = typeof email === 'string' ? email.trim() : ''

  if (supabase) {
    // Try primary intake_submissions table
    const { data, error } = await supabase
      .from('intake_submissions')
      .select('*')
      .eq('email', safeEmail)
      .order('created_at', { ascending: false })

    if (!error && Array.isArray(data)) {
      return data.map((row) => mapSubmissionRow(row))
    }

    // Fallback to projects view if intake_submissions is missing
    const { data: projects, error: projError } = await supabase
      .from('projects')
      .select('id, title, owner_email, status, type, due_date, created_at, updated_at, briefs(summary, scope)')
      .eq('owner_email', safeEmail)
      .order('created_at', { ascending: false })

    if (!projError && Array.isArray(projects)) {
      return projects.map((row) => mapProject({ ...row, key_moment: row.due_date }))
    }
  }

  // In-memory fallback
  return memoryStore.submissions.filter((s) => s.email === safeEmail)
}
