import Link from 'next/link'
import { requireTeamUser } from '@lib/auth'

import { listSubmissions } from '@lib/submission-store'
import { ProjectTypeBadge } from '@components/ProjectTypeBadge'
import { StatusPill } from '@components/StatusPill'

export const dynamic = 'force-dynamic'

export default async function ProjectsPage({ searchParams }) {
  await requireTeamUser('/projects')
  const submissions = await listSubmissions()
  const filters = mapFilters(searchParams)
  const filtered = submissions.filter((submission) => filterSubmission(submission, filters))

  return (
    <div className="space-y-10">
      <header className="flex flex-wrap items-start justify-between gap-6">
        <div className="space-y-3">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-400">
            Pipeline overview
          </span>
          <h1 className="text-3xl font-semibold text-white sm:text-4xl">Projects in motion</h1>
          <p className="max-w-2xl text-sm text-slate-300/90">
            Accepted and pending submissions appear here as soon as the review team approves them. Drill into each request to see metadata, attachments, and workflow notes.
          </p>
          <Filters filters={filters} />
        </div>
        <Link
          href="/new"
          className="rounded-full border border-white/15 bg-white/90 px-6 py-2 text-sm font-semibold text-[#111216] shadow-[0_22px_60px_rgba(9,10,14,0.55)] transition hover:bg-white"
        >
          + New Engagement
        </Link>
      </header>

      {filtered.length === 0 ? (
        <div className="rounded-[32px] border border-dashed border-white/15 bg-white/5 p-10 text-sm text-slate-400">
          No projects match your filters. Adjust filters or submit a new engagement to see it here.
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {filtered.map((submission, index) => (
            <article
              key={submission.id}
              className="group relative overflow-hidden rounded-[28px] border border-white/10 bg-white/10 p-6 shadow-[0_28px_70px_rgba(9,10,14,0.5)] transition duration-300 hover:border-white/20 hover:shadow-[0_36px_90px_rgba(9,10,14,0.6)]"
            >
              <div className="absolute right-6 top-6 h-12 w-12 rounded-full bg-white/10 blur-2xl opacity-0 transition duration-300 group-hover:opacity-100" aria-hidden="true" />
              <header className="relative flex items-start justify-between gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-semibold text-white">
                      {submission.metadata?.projectTitle ?? submission.name}
                    </h2>
                    <ProjectTypeBadge type={submission.metadata?.projectType ?? 'other'} />
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                    <StatusPill status={submission.status} />
                    <span>{submission.metadata?.clientName ?? submission.email}</span>
                    {submission.metadata?.budget ? <span>Investment {submission.metadata.budget}</span> : null}
                    {submission.metadata?.keyMoment ? <span>Key moment {submission.metadata.keyMoment}</span> : null}
                  </div>
                </div>
                <span className="rounded-full bg-white/5 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-400">
                  #{index + 1}
                </span>
              </header>
              <p className="mt-4 line-clamp-2 text-sm leading-relaxed text-slate-300/90">{submission.details}</p>
              <div className="mt-4 grid gap-2 text-xs text-slate-400">
                <div className="flex items-center justify-between">
                  <span>Submitted</span>
                  <span>{formatDate(submission.createdAt)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Primary contact</span>
                  <span>{submission.email}</span>
                </div>
              </div>
              <Link href={`/projects/${submission.id}`} className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary">
                View details →
              </Link>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}

function Filters({ filters }) {
  return (
    <form className="mt-4 flex flex-col gap-3 text-xs text-white/70 md:flex-row md:items-center" action="/projects" method="get">
      <input type="search" name="q" defaultValue={filters.query} placeholder="Search client, project, or email" />
      <select name="status" defaultValue={filters.status} className="min-w-[150px]">
        <option value="">All statuses</option>
        <option value="pending">Pending</option>
        <option value="accepted">Accepted</option>
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
  if (submission.status === 'rejected') return false
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

function formatDate(value) {
  const date = new Date(value)
  return date.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })
}
