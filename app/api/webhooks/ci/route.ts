import { randomUUID } from 'crypto'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createServiceSupabaseClient } from '@lib/supabase'

const Schema = z.object({
  runId: z.string().uuid(),
  status: z.enum(['queued', 'running', 'passed', 'failed']),
  ciUrl: z.string().url().optional(),
  logs: z.string().optional(),
  previewUrl: z.string().url().optional()
})

export async function POST(request: Request) {
  const payload = Schema.parse(await request.json())
  const supabase = createServiceSupabaseClient()

  const state = payload.status === 'passed' ? 'passed' : payload.status === 'failed' ? 'failed' : payload.status

  const { data: run, error: runError } = await supabase
    .from('runs')
    .select('id, task_id, tasks(project_id)')
    .eq('id', payload.runId)
    .single()

  if (runError || !run) {
    return NextResponse.json({ error: runError?.message ?? 'run not found' }, { status: 404 })
  }

  const tasksRelation = run.tasks as any
  const projectId = Array.isArray(tasksRelation) ? tasksRelation[0]?.project_id ?? null : tasksRelation?.project_id ?? null

  await supabase
    .from('runs')
    .update({
      state,
      ci_url: payload.ciUrl ?? null,
      preview_url: payload.previewUrl ?? null,
      logs: payload.logs ?? null,
      updated_at: new Date().toISOString()
    })
    .eq('id', payload.runId)

  if (state === 'passed') {
    await supabase
      .from('tasks')
      .update({ status: 'review', updated_at: new Date().toISOString() })
      .eq('id', run.task_id)
  }

  if (state === 'failed') {
    await supabase
      .from('tasks')
      .update({ status: 'blocked', updated_at: new Date().toISOString() })
      .eq('id', run.task_id)
  }

  await supabase.from('events').insert({
    id: randomUUID(),
    project_id: projectId,
    kind: 'run_update',
    payload,
    created_at: new Date().toISOString()
  })

  return NextResponse.json({ ok: true })
}
