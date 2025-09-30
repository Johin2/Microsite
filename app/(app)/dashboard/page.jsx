import Link from 'next/link'
import { requireTeamUser } from '@lib/auth'
import { formatDistanceToNow } from 'date-fns'

import { listSubmissions } from '@lib/submission-store'
import { ProjectTypeBadge } from '@components/ProjectTypeBadge'
import { StatusPill } from '@components/StatusPill'

export const dynamic = 'force-dynamic'

export default async function DashboardPage({ searchParams }) {
  await requireTeamUser('/dashboard')
  const submissions = await listSubmissions()
  const filters = mapFilters(searchParams)
  const filtered = submissions.filter((submission) => filterSubmission(submission, filters))

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

      <section className="overflow-hidden rounded-[32px] border border-white/10 bg-white/10 shadow-[0_34px_82px_rgba(0,0,0,0.55)] backdrop-blur-2xl">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 px-8 py-6">
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-white">Submission portfolio</h2>
            <p className="text-xs uppercase tracking-[0.28em] text-neutral-400">Filter and triage current engagements</p>
            <Filters filters={filters} />
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
                <th className="px-8 py-4 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/8 text-sm text-neutral-200/85">
              {filtered.map((submission) => (
                <tr key={submission.id} className="transition duration-200 hover:bg-white/[0.06]">
                  <td className="px-8 py-5">
                    <Link className="font-semibold text-white hover:text-primary" href={`/projects/${submission.id}`}>
                      {submission.metadata?.projectTitle ?? submission.name}
                    </Link>
                    <p className="mt-1 text-xs text-neutral-400 line-clamp-1">{submission.details}</p>
                  </td>
                  <td className="px-8 py-5">
                    <ProjectTypeBadge type={submission.metadata?.projectType ?? 'other'} />
                  </td>
                  <td className="px-8 py-5">
                    <StatusPill status={submission.status} />
                  </td>
                  <td className="px-8 py-5 text-neutral-400">
                    <span className="block text-white/80">{submission.metadata?.clientName ?? '—'}</span>
                    <span className="text-xs text-white/50">{submission.email}</span>
                  </td>
                  <td className="px-8 py-5 text-neutral-400">
                    <div className="flex flex-col">
                      <span>{formatSubmittedDate(submission.createdAt)}</span>
                      <span className="text-xs text-neutral-500">{formatSubmittedRelative(submission.createdAt)}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/projects/${submission.id}`}
                        className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-white/70 transition hover:bg-white/20 hover:text-white"
                      >
                        Review
                      </Link>
                      <Link
                        href={`/projects/${submission.id}/plan`}
                        className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-white/70 transition hover:bg-white/20 hover:text-white"
                      >
                        Open Plan
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 ? (
                <tr>
                  <td className="px-8 py-6 text-center text-sm text-neutral-400" colSpan={6}>
                    No submissions match the current filters.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        {rejected.length ? (
          <footer className="border-t border-white/10 bg-white/5 px-8 py-5 text-xs text-neutral-400">
            {rejected.length} request{rejected.length === 1 ? '' : 's'} marked as rejected remain hidden from the projects gallery.
          </footer>
        ) : null}
      </section>
    </div>
  )
}

function MetricCard({ title, value, description, accent }) {
  return (
    <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-white/10 p-6 shadow-[0_28px_70px_rgba(0,0,0,0.5)] backdrop-blur-2xl transition duration-300 hover:border-white/20 hover:shadow-[0_34px_88px_rgba(0,0,0,0.58)]">
      <div className={`absolute inset-0 bg-gradient-to-br ${accent}`} aria-hidden="true" />
      <div className="relative space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/70">{title}</p>
        <p className="text-4xl font-semibold text-white">{value}</p>
        <p className="text-xs text-white/60">{description}</p>
      </div>
    </div>
  )
}

function Filters({ filters }) {
  return (
    <form className="mt-4 flex flex-col gap-3 text-xs text-white/70 md:flex-row md:items-center" action="/dashboard" method="get">
      <input
        type="search"
        name="q"
        defaultValue={filters.query}
        placeholder="Search client, project, or email"
      />
      <select name="status" defaultValue={filters.status} className="min-w-[150px]">
        <option value="">All statuses</option>
        <option value="pending">Pending</option>
        <option value="accepted">Accepted</option>
        <option value="rejected">Rejected</option>
      </select>
      <select name="type" defaultValue={filters.type} className="min-w-[180px]">
        <option value="">All project types</option>
        <option value="Brand identity">Brand identity</option>
        <option value="Campaign">Campaign</option>
        <option value="Digital product">Digital product</option>
        <option value="Spatial / retail">Spatial / retail</option>
        <option value="Launch strategy">Launch strategy</option>
        <option value="other">Other</option>
      </select>
      <button type="submit" className="rounded-full border border-white/15 bg-white/10 px-3 py-2 text-white/70">
        Apply
      </button>
    </form>
  )
}

function mapFilters(searchParams = {}) {
  const status = typeof searchParams.status === 'string' ? searchParams.status.trim() : ''
  const type = typeof searchParams.type === 'string' ? searchParams.type.trim() : ''
  const query = typeof searchParams.q === 'string' ? searchParams.q.trim().toLowerCase() : ''
  return { status, type, query }
}

function filterSubmission(submission, filters) {
  if (filters.status && submission.status !== filters.status) return false
  if (filters.type) {
    const projectType = (submission.metadata?.projectType || 'other').toLowerCase()
    const desired = filters.type.toLowerCase()
    if (projectType !== desired) return false
  }
  if (filters.query) {
    const haystack = `${submission.metadata?.projectTitle ?? ''} ${submission.metadata?.clientName ?? ''} ${submission.email}`.toLowerCase()
    if (!haystack.includes(filters.query)) return false
  }
  return true
}

function formatSubmittedDate(value) {
  return new Date(value).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatSubmittedRelative(value) {
  try {
    return formatDistanceToNow(new Date(value), { addSuffix: true })
  } catch (error) {
    return '—'
  }
}
