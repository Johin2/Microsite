import Link from 'next/link'
import { notFound } from 'next/navigation'

import { findSubmission } from '@lib/submission-store'
import { ProjectTypeBadge } from '@components/ProjectTypeBadge'
import { StatusPill } from '@components/StatusPill'

export const dynamic = 'force-dynamic'

export default async function ProjectPage({ params }) {
  const submission = await findSubmission(params.id)

  if (!submission) {
    notFound()
  }

  return (
    <div className="space-y-12">
      <header className="relative overflow-hidden rounded-[32px] border border-white/10 bg-white/10 p-8 shadow-[0_34px_82px_rgba(9,10,14,0.55)] backdrop-blur-2xl">
        <div className="absolute inset-x-0 top-0 h-32 bg-[radial-gradient(circle_at_top,_rgba(245,245,245,0.14),_transparent_70%)]" aria-hidden="true" />
        <div className="relative flex flex-wrap items-start justify-between gap-8">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-semibold text-white sm:text-4xl">
                {submission.metadata?.projectTitle ?? submission.name}
              </h1>
              <ProjectTypeBadge type={submission.metadata?.projectType ?? 'other'} />
            </div>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
              <StatusPill status={submission.status} />
              <span>Client: {submission.metadata?.clientName ?? submission.email}</span>
              {submission.metadata?.keyMoment ? <span>Key moment {submission.metadata.keyMoment}</span> : null}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/review"
              className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-white/30 hover:text-white"
            >
              Open Review Console
            </Link>
            <Link href="/projects" className="text-sm font-semibold text-primary">
              ← Back to Projects
            </Link>
          </div>
        </div>
      </header>

      <section className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <article className="rounded-[28px] border border-white/10 bg-white/10 p-6 text-sm text-slate-200/90 shadow-[0_28px_72px_rgba(9,10,14,0.55)] backdrop-blur-2xl">
          <h2 className="text-lg font-semibold text-white">Request Details</h2>
          <p className="mt-4 whitespace-pre-line leading-relaxed text-slate-300/90">{submission.details}</p>
        </article>
        <article className="space-y-4 rounded-[28px] border border-white/10 bg-white/10 p-6 text-sm text-slate-200/90 shadow-[0_28px_72px_rgba(9,10,14,0.55)] backdrop-blur-2xl">
          <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">Metadata</h3>
          <Metadata label="Client" value={submission.metadata?.clientName ?? '—'} />
          <Metadata label="Project type" value={submission.metadata?.projectType ?? '—'} />
          <Metadata label="Investment" value={submission.metadata?.budget ?? '—'} />
          <Metadata label="Key moment" value={submission.metadata?.keyMoment ?? '—'} />
          <Metadata label="Created" value={new Date(submission.createdAt).toLocaleString()} />
          <Metadata label="Last updated" value={new Date(submission.updatedAt).toLocaleString()} />
        </article>
      </section>

      <section className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <article className="rounded-[28px] border border-white/10 bg-white/10 p-6 text-sm text-slate-200/90 shadow-[0_28px_72px_rgba(9,10,14,0.55)] backdrop-blur-2xl">
          <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">Reference links</h3>
          {Array.isArray(submission.metadata?.references) && submission.metadata.references.length ? (
            <ul className="mt-4 space-y-2">
              {submission.metadata.references.map((file, index) => (
                <li key={`${file.url}-${index}`} className="truncate">
                  <a className="text-primary" href={file.url} target="_blank" rel="noreferrer">
                    {file.name || file.url}
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-xs text-slate-500">No attachments provided.</p>
          )}
        </article>
        <article className="rounded-[28px] border border-white/10 bg-gradient-to-br from-[#0f1014]/95 via-[#121317]/90 to-[#15161b]/95 p-6 text-sm text-slate-200/85 shadow-[0_28px_72px_rgba(9,10,14,0.55)] backdrop-blur-2xl">
          <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">Workflow status</h3>
          <p className="mt-4 leading-relaxed text-slate-300/85">
            This simplified workspace tracks intake submissions. Use the review console to accept or reject the request. The production build connects to the agent pipeline for planning, estimation, and auto-repair.
          </p>
        </article>
      </section>
    </div>
  )
}

function Metadata({ label, value }) {
  return (
    <p className="flex items-center justify-between gap-4 text-slate-300/90">
      <span className="text-[11px] uppercase tracking-[0.28em] text-slate-500">{label}</span>
      <span className="text-sm font-medium text-slate-200">{value}</span>
    </p>
  )
}
