import { randomUUID } from 'crypto'
import { createServiceSupabaseClient } from '../supabase'
import { MAX_REPAIR_ATTEMPTS } from '../guardrails'

export async function startRun({ taskId, metadata }) {
  const supabase = createServiceSupabaseClient()
  const attempt = (await nextAttempt(taskId)) ?? 0

  const { data, error } = await supabase
    .from('runs')
    .insert({
      id: randomUUID(),
      task_id: taskId,
      state: 'queued',
      attempt,
      result: metadata ?? null
    })
    .select('*')
    .single()

  if (error) {
    throw error
  }

  return mapRun(data)
}

export async function markRunState(runId, state, payload) {
  const supabase = createServiceSupabaseClient()
  const { error } = await supabase
    .from('runs')
    .update({ state, result: payload ?? null, updated_at: new Date().toISOString() })
    .eq('id', runId)

  if (error) {
    throw error
  }
}

export async function runsExhausted(taskId) {
  const supabase = createServiceSupabaseClient()
  const { data, error } = await supabase
    .from('runs')
    .select('attempt')
    .eq('task_id', taskId)
    .order('attempt', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    throw error
  }

  return (data?.attempt ?? 0) >= MAX_REPAIR_ATTEMPTS
}

async function nextAttempt(taskId) {
  const supabase = createServiceSupabaseClient()
  const { data, error } = await supabase
    .from('runs')
    .select('attempt')
    .eq('task_id', taskId)
    .order('attempt', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    throw error
  }

  return (data?.attempt ?? -1) + 1
}

function mapRun(row) {
  return {
    id: row.id,
    taskId: row.task_id,
    state: row.state,
    attempt: row.attempt,
    branch: row.branch,
    prUrl: row.pr_url,
    ciUrl: row.ci_url,
    previewUrl: row.preview_url,
    logs: row.logs,
    result: row.result,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}
