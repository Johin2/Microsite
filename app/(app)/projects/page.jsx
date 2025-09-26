import Link from 'next/link'

import { listSubmissions } from '@lib/submission-store'
import { ProjectTypeBadge } from '@components/ProjectTypeBadge'
import { StatusPill } from '@components/StatusPill'

export const dynamic = 'force-dynamic'

export default async function ProjectsPage() {
  const submissions = await listSubmissions()
  const visible = submissions.filter((item) => item.status !== 'rejected')

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
        </div>
        <Link
          href="/new"
          className="rounded-full border border-white/15 bg-white/90 px-6 py-2 text-sm font-semibold text-[#111216] shadow-[0_22px_60px_rgba(9,10,14,0.55)] transition hover:bg-white"
        >
          + New Engagement
        </Link>
      </header>

      {visible.length === 0 ? (
        <div className="rounded-[32px] border border-dashed border-white/15 bg-white/5 p-10 text-sm text-slate-400">
          No projects yet. Submit a request and accept it in the review console to see it here.
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {visible.map((submission, index) => (
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
                    {submission.metadata?.keyMoment ? <span>Key moment {submission.metadata.keyMoment}</span> : null}
                  </div>
                </div>
                <span className="rounded-full bg-white/5 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-400">
                  #{index + 1}
                </span>
              </header>
              <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-slate-300/90">{submission.details}</p>
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
