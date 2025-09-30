import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireTeamUser } from '@lib/auth'

import { createServiceSupabaseClient } from '@lib/supabase'
import { RunTimeline } from '@components/RunTimeline'
import { StatusPill } from '@components/StatusPill'
import { RunTaskButton } from '@components/RunTaskButton'

export default async function TaskPage({ params }) {
  await requireTeamUser()
  const supabase = createServiceSupabaseClient()

  const { data: task } = await supabase.from('tasks').select('*').eq('id', params.id).single()

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

  const runData = Array.isArray(runs)
    ? runs.map((run) => ({
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
    : []

  const acceptance = Array.isArray(task.acceptance) ? task.acceptance : []

  return (
    <div className="space-y-12">
      <header className="relative overflow-hidden rounded-[32px] border border-white/10 bg-white/10 p-8 shadow-[0_34px_82px_rgba(0,0,0,0.55)] backdrop-blur-2xl">
        <div className="absolute inset-x-0 top-0 h-28 bg-[radial-gradient(circle_at_top,_rgba(245,245,245,0.14),_transparent_70%)]" aria-hidden="true" />
        <div className="relative flex flex-wrap items-start justify-between gap-6">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-neutral-400">Task</p>
            <h1 className="text-3xl font-semibold text-white">{task.title}</h1>
            <p className="text-sm text-neutral-300/90">{task.description}</p>
            {project ? (
              <p className="text-xs text-neutral-500">
                Project:{' '}
                <Link href={`/projects/${project.id}`} className="text-primary">
                  {project.title}
                </Link>
              </p>
            ) : null}
            <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-neutral-400">
              <StatusPill status={task.status} />
              {task.assignee ? <span>Assignee: {task.assignee}</span> : null}
              {task.estimate_hours ? <span>Estimate: {task.estimate_hours}h</span> : null}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <RunTaskButton taskId={params.id} />
            <Link href={`/projects/${project?.id ?? task.project_id}`} className="text-sm font-semibold text-primary">
              ← Back to Project
            </Link>
          </div>
        </div>
      </header>

      <section className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <article className="rounded-[28px] border border-white/10 bg-white/10 p-6 text-sm text-neutral-200/90 shadow-[0_28px_72px_rgba(0,0,0,0.55)] backdrop-blur-2xl">
          <h2 className="text-lg font-semibold text-white">Acceptance Tests</h2>
          {acceptance.length ? (
            <ul className="mt-4 space-y-3">
              {acceptance.map((item) => (
                <li key={item.id ?? item.description} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="font-medium text-white">{item.description}</p>
                  {item.validation ? <p className="mt-2 text-xs text-neutral-400">Validation: {item.validation}</p> : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-neutral-500">No acceptance tests recorded.</p>
          )}
        </article>
        <article className="rounded-[28px] border border-white/10 bg-gradient-to-br from-black/95 via-neutral-950/90 to-neutral-900/95 p-6 text-sm text-neutral-200/85 shadow-[0_28px_72px_rgba(0,0,0,0.55)] backdrop-blur-2xl">
          <h2 className="text-lg font-semibold text-white">Agent run log</h2>
          <p className="mt-3 text-sm text-neutral-300/85">
            Every run triggers the DevOps runner, QA/Test agent, and auto-repair loop. Completed runs and previews surface below.
          </p>
        </article>
      </section>

      <section className="rounded-[32px] border border-white/10 bg-white/10 p-6 shadow-[0_34px_82px_rgba(0,0,0,0.55)] backdrop-blur-2xl">
        <h2 className="text-lg font-semibold text-white">Run Timeline</h2>
        <div className="mt-6">
          <RunTimeline runs={runData} />
        </div>
      </section>
    </div>
  )
}
