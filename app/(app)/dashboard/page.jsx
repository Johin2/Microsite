import Link from 'next/link'

import { listSubmissions } from '@lib/submission-store'
import { ProjectTypeBadge } from '@components/ProjectTypeBadge'
import { StatusPill } from '@components/StatusPill'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const submissions = await listSubmissions()
  const total = submissions.length
  const accepted = submissions.filter((item) => item.status === 'accepted')
  const pending = submissions.filter((item) => item.status === 'pending')
  const rejected = submissions.filter((item) => item.status === 'rejected')

  return (
    <div className="space-y-12">
      <section className="grid gap-6 md:grid-cols-3">
        <MetricCard
          title="Active engagements"
          value={total}
          description="Briefs currently in motion"
          accent="from-white/18 via-white/8 to-transparent"
        />
        <MetricCard
          title="Awaiting review"
          value={pending.length}
          description="Discovery call or scope confirmation"
          accent="from-white/14 via-white/6 to-transparent"
        />
        <MetricCard
          title="Greenlit"
          value={accepted.length}
          description="Moving through production and launch"
          accent="from-white/16 via-white/7 to-transparent"
        />
      </section>

      <section className="overflow-hidden rounded-[32px] border border-white/10 bg-white/10 shadow-[0_34px_82px_rgba(9,10,14,0.55)] backdrop-blur-2xl">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 px-8 py-6">
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-white">Submission Portfolio</h2>
            <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Latest requests sorted by status</p>
          </div>
          <Link
            href="/new"
            className="rounded-full border border-white/15 bg-white/90 px-5 py-2 text-sm font-semibold text-[#111216] transition hover:bg-white"
          >
            + New Engagement
          </Link>
        </header>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-white/12">
            <thead className="bg-white/10 text-xs uppercase tracking-[0.28em] text-white/70">
              <tr>
                <th className="px-8 py-4 text-left">Project</th>
                <th className="px-8 py-4 text-left">Type</th>
                <th className="px-8 py-4 text-left">Status</th>
                <th className="px-8 py-4 text-left">Owner</th>
                <th className="px-8 py-4 text-left">Submitted</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/8 text-sm text-slate-200/85">
              {submissions.map((submission) => (
                <tr key={submission.id} className="transition duration-200 hover:bg-white/[0.06]">
                  <td className="px-8 py-5">
                    <Link className="font-semibold text-white hover:text-primary" href={`/projects/${submission.id}`}>
                      {submission.metadata?.projectTitle ?? submission.name}
                    </Link>
                    <p className="mt-1 text-xs text-slate-400 line-clamp-1">{submission.details}</p>
                  </td>
                  <td className="px-8 py-5">
                    <ProjectTypeBadge type={submission.metadata?.projectType ?? 'other'} />
                  </td>
                  <td className="px-8 py-5">
                    <StatusPill status={submission.status} />
                  </td>
                  <td className="px-8 py-5 text-slate-400">
                    <span className="block text-white/80">{submission.metadata?.clientName ?? '—'}</span>
                    <span className="text-xs text-white/50">{submission.email}</span>
                  </td>
                  <td className="px-8 py-5 text-slate-400">{new Date(submission.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {rejected.length ? (
          <footer className="border-t border-white/10 bg-white/5 px-8 py-5 text-xs text-slate-400">
            {rejected.length} request{rejected.length === 1 ? '' : 's'} marked as rejected remain hidden from the projects gallery.
          </footer>
        ) : null}
      </section>
    </div>
  )
}

function MetricCard({ title, value, description, accent }) {
  return (
    <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-white/10 p-6 shadow-[0_28px_70px_rgba(9,10,14,0.5)] backdrop-blur-2xl transition duration-300 hover:border-white/20 hover:shadow-[0_34px_88px_rgba(9,10,14,0.58)]">
      <div className={`absolute inset-0 bg-gradient-to-br ${accent}`} aria-hidden="true" />
      <div className="relative space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/70">{title}</p>
        <p className="text-4xl font-semibold text-white">{value}</p>
        <p className="text-xs text-white/60">{description}</p>
      </div>
    </div>
  )
}
