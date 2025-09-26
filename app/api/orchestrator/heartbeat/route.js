import { NextResponse } from 'next/server'
import { createServiceSupabaseClient } from '@lib/supabase'
import { orchestratorStep } from '@lib/orchestrator'

const ACTIVE_STATUSES = ['intake', 'planning', 'estimated', 'executing']

export async function POST() {
  const supabase = createServiceSupabaseClient()
  const { data: projects, error } = await supabase
    .from('projects')
    .select('id, status')
    .in('status', ACTIVE_STATUSES)
    .limit(10)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const results = []
  for (const project of projects ?? []) {
    try {
      const result = await orchestratorStep(project.id)
      results.push(result)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      results.push({ projectId: project.id, status: project.status, error: message })
    }
  }

  return NextResponse.json({ results })
}

// Support GET for compatibility with CRONs and spec
export async function GET() {
  return POST()
}
