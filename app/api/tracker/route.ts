import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createServiceSupabaseClient } from '@lib/supabase'

const UpdateSchema = z.object({
  taskId: z.string().uuid(),
  status: z.enum(['backlog', 'in_progress', 'review', 'done', 'blocked'])
})

export async function GET(request: Request) {
  const url = new URL(request.url)
  const projectId = url.searchParams.get('projectId')
  if (!projectId) {
    return NextResponse.json({ error: 'projectId is required' }, { status: 400 })
  }

  const supabase = createServiceSupabaseClient()
  const { data: tasks, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const board = groupByStatus(tasks ?? [])

  return NextResponse.json({ board, tasks: tasks ?? [] })
}

export async function POST(request: Request) {
  const body = UpdateSchema.parse(await request.json())
  const supabase = createServiceSupabaseClient()

  const { error } = await supabase
    .from('tasks')
    .update({ status: body.status, updated_at: new Date().toISOString() })
    .eq('id', body.taskId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

function groupByStatus(tasks: any[]) {
  const columns = {
    backlog: [] as any[],
    in_progress: [] as any[],
    review: [] as any[],
    done: [] as any[],
    blocked: [] as any[]
  }

  for (const task of tasks) {
    const status = (task.status ?? 'backlog') as keyof typeof columns
    if (!columns[status]) {
      columns.backlog.push(task)
    } else {
      columns[status].push(task)
    }
  }

  return columns
}
