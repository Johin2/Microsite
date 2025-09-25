import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createServiceSupabaseClient } from '@lib/supabase'
import { PlanTree } from '@components/PlanTree'
import { Editor } from '@components/Editor'
import { MilestoneSchema } from '@lib/schemas'
import { z } from 'zod'

type Milestone = z.infer<typeof MilestoneSchema>

export default async function ProjectPlanPage({ params }: { params: { id: string } }) {
  const supabase = createServiceSupabaseClient()

  const [{ data: project }, { data: plan }] = await Promise.all([
    supabase.from('projects').select('id, title').eq('id', params.id).single(),
    supabase
      .from('plans')
      .select('*')
      .eq('project_id', params.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
  ])

  if (!project) notFound()

  const milestoneData: Milestone[] = Array.isArray(plan?.milestones)
    ? (plan?.milestones as Milestone[])
    : []
  const acceptance = Array.isArray(plan?.acceptance) ? (plan?.acceptance as any[]) : []
  const estimates = plan?.estimates as any

  return (
    <div className="space-y-10">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Plan • {project.title}</h1>
          <p className="text-sm text-slate-400">Milestones, tasks, acceptance, and estimates.</p>
        </div>
        <Link href={`/(app)/projects/${params.id}`} className="text-sm text-primary">
          ← Back to Project
        </Link>
      </header>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-white">Milestones</h2>
        <PlanTree milestones={milestoneData} />
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-white">Acceptance Criteria</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {acceptance.length ? (
            acceptance.map((item) => (
              <article key={item.id ?? item.description} className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 text-sm text-slate-300">
                <p className="font-medium text-white">{item.description}</p>
                {item.validation ? <p className="mt-2 text-xs text-slate-500">Validation: {item.validation}</p> : null}
              </article>
            ))
          ) : (
            <p className="text-sm text-slate-500">No acceptance criteria yet.</p>
          )}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-white">Estimates</h2>
        {estimates?.tasks?.length ? (
          <div className="overflow-hidden rounded-2xl border border-slate-800">
            <table className="min-w-full divide-y divide-slate-800 text-sm text-slate-300">
              <thead className="bg-slate-950/50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 text-left">Task</th>
                  <th className="px-4 py-3 text-left">Role</th>
                  <th className="px-4 py-3 text-left">Optimistic</th>
                  <th className="px-4 py-3 text-left">Likely</th>
                  <th className="px-4 py-3 text-left">Pessimistic</th>
                  <th className="px-4 py-3 text-left">Confidence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900">
                {estimates.tasks.map((item: any) => (
                  <tr key={item.taskId}>
                    <td className="px-4 py-3 text-white">{item.taskId}</td>
                    <td className="px-4 py-3">{item.role}</td>
                    <td className="px-4 py-3">{item.optimisticHours}h</td>
                    <td className="px-4 py-3">{item.likelyHours}h</td>
                    <td className="px-4 py-3">{item.pessimisticHours}h</td>
                    <td className="px-4 py-3">{Math.round(item.confidence * 100)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-slate-500">Estimations pending.</p>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-white">Notes</h2>
        <Editor initialValue={JSON.stringify(estimates ?? {}, null, 2)} label="Estimate JSON" />
      </section>
    </div>
  )
}
