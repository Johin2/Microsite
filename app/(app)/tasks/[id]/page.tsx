import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createServiceSupabaseClient } from '@lib/supabase'
import { RunTimeline } from '@components/RunTimeline'
import { StatusPill } from '@components/StatusPill'
import { RunTaskButton } from '@components/RunTaskButton'

export default async function TaskPage({ params }: { params: { id: string } }) {
  const supabase = createServiceSupabaseClient()

  const { data: task } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!task) {
    notFound()
  }

  const { data: project } = await supabase
    .from('projects')
    .select('id, title')
    .eq('id', task.project_id)
    .single()

  const { data: runs } = await supabase
    .from('runs')
    .select('*')
    .eq('task_id', params.id)
    .order('created_at', { ascending: true })

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

  const acceptance = Array.isArray(task.acceptance) ? (task.acceptance as any[]) : []

  return (
    <div className="space-y-10">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">Task</p>
          <h1 className="text-2xl font-semibold text-white">{task.title}</h1>
          <p className="text-sm text-slate-400">{task.description}</p>
          {project ? (
            <p className="text-xs text-slate-500">
              Project:{' '}
              <Link href={`/(app)/projects/${project.id}`} className="text-primary">
                {project.title}
              </Link>
            </p>
          ) : null}
          <div className="mt-3 flex items-center gap-3 text-xs text-slate-400">
            <StatusPill status={task.status} />
            {task.assignee ? <span>Assignee: {task.assignee}</span> : null}
            {task.estimate_hours ? <span>Estimate: {task.estimate_hours}h</span> : null}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <RunTaskButton taskId={params.id} />
          <Link href={`/(app)/projects/${project?.id ?? task.project_id}`} className="text-sm text-primary">
            ← Back to Project
          </Link>
        </div>
      </header>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-white">Acceptance Tests</h2>
        {acceptance.length ? (
          <ul className="space-y-3 text-sm text-slate-300">
            {acceptance.map((accept) => (
              <li key={accept.id ?? accept.description} className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
                <p className="font-medium text-white">{accept.description}</p>
                {accept.validation ? <p className="mt-2 text-xs text-slate-500">Validation: {accept.validation}</p> : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-500">No acceptance tests recorded.</p>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-white">Run Timeline</h2>
        <RunTimeline runs={runData as any} />
      </section>
    </div>
  )
}
