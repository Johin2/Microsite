import { randomUUID } from 'crypto'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createServiceSupabaseClient } from '@lib/supabase'
import { triageFailure } from '@lib/agents'

const Schema = z.object({
  runId: z.string().uuid(),
  ciLog: z.string(),
  failingTests: z.array(z.string()).optional()
})

export async function POST(request) {
  const { runId, ciLog, failingTests } = Schema.parse(await request.json())
  const supabase = createServiceSupabaseClient()

  const { data: run, error: runError } = await supabase
    .from('runs')
    .select('id, task_id, tasks(project_id)')
    .eq('id', runId)
    .single()

  if (runError || !run) {
    return NextResponse.json({ error: runError?.message ?? 'run not found' }, { status: 404 })
  }

  const tasksRelation = run.tasks
  const projectId = Array.isArray(tasksRelation)
    ? tasksRelation[0]?.project_id ?? null
    : tasksRelation?.project_id ?? null

  const triage = await triageFailure(ciLog, failingTests ?? [])

  await supabase
    .from('runs')
    .update({
      state: 'failed',
      logs: ciLog,
      result: {
        triage,
        failingTests
      },
      updated_at: new Date().toISOString()
    })
    .eq('id', runId)

  await supabase
    .from('tasks')
    .update({ status: 'blocked', updated_at: new Date().toISOString() })
    .eq('id', run.task_id)

  await supabase.from('events').insert({
    id: randomUUID(),
    project_id: projectId,
    kind: 'triage',
    payload: { runId, triage },
    created_at: new Date().toISOString()
  })

  return NextResponse.json({ triage })
}
