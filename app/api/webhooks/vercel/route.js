import { randomUUID } from 'crypto'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createServiceSupabaseClient } from '@lib/supabase'

const Schema = z.object({
  runId: z.string().uuid(),
  previewUrl: z.string().url(),
  status: z.enum(['ready', 'building', 'error'])
})

export async function POST(request) {
  const payload = Schema.parse(await request.json())
  const supabase = createServiceSupabaseClient()

  const { data: run, error: runError } = await supabase
    .from('runs')
    .select('id, task_id, tasks(project_id)')
    .eq('id', payload.runId)
    .single()

  if (runError || !run) {
    return NextResponse.json({ error: runError?.message ?? 'run not found' }, { status: 404 })
  }

  const tasksRelation = run.tasks
  const projectId = Array.isArray(tasksRelation)
    ? tasksRelation[0]?.project_id ?? null
    : tasksRelation?.project_id ?? null

  await supabase
    .from('runs')
    .update({
      preview_url: payload.previewUrl,
      updated_at: new Date().toISOString()
    })
    .eq('id', payload.runId)

  await supabase.from('events').insert({
    id: randomUUID(),
    project_id: projectId,
    kind: 'run_update',
    payload,
    created_at: new Date().toISOString()
  })

  return NextResponse.json({ ok: true })
}
