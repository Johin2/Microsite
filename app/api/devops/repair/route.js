import { randomUUID } from 'crypto'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createServiceSupabaseClient } from '@lib/supabase'
import { proposeRepair } from '@lib/agents'

const Schema = z.object({
  runId: z.string().uuid(),
  triage: z.unknown()
})

export async function POST(request) {
  const { runId, triage } = Schema.parse(await request.json())
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

  const proposal = await proposeRepair({
    triage,
    repoState: { taskId: run.task_id }
  })

  await supabase
    .from('runs')
    .update({
      state: proposal.stop ? 'needs_review' : 'running',
      result: {
        triage,
        proposal
      },
      updated_at: new Date().toISOString()
    })
    .eq('id', runId)

  await supabase.from('events').insert({
    id: randomUUID(),
    project_id: projectId,
    kind: 'repair',
    payload: { runId, proposal },
    created_at: new Date().toISOString()
  })

  return NextResponse.json({ proposal })
}
