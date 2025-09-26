import clsx from 'clsx'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { findSubmission } from '@lib/submission-store'
import { ProjectTypeBadge } from '@components/ProjectTypeBadge'
import { StatusPill } from '@components/StatusPill'
import { CheckCircle } from 'lucide-react'

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
            <div className="grid gap-2 text-xs text-slate-400 sm:grid-cols-2">
              <Metadata label="Status" value={<StatusPill status={submission.status} />} asRow={false} />
              <Metadata label="Client" value={submission.metadata?.clientName ?? submission.email} />
              <Metadata label="Investment" value={submission.metadata?.budget ?? '—'} />
              <Metadata label="Key moment" value={submission.metadata?.keyMoment ?? '—'} />
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
          <h2 className="text-lg font-semibold text-white">Request details</h2>
          <p className="mt-4 whitespace-pre-line leading-relaxed text-slate-300/90">{submission.details}</p>
        </article>
        <article className="space-y-4 rounded-[28px] border border-white/10 bg-white/10 p-6 text-sm text-slate-200/90 shadow-[0_28px_72px_rgba(9,10,14,0.55)] backdrop-blur-2xl">
          <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">Project metadata</h3>
          <Metadata label="Company" value={submission.metadata?.company ?? '—'} />
          <Metadata label="Contact" value={submission.email} />
          <Metadata label="Timeline" value={submission.metadata?.timeline ?? '—'} />
          <Metadata label="Referral" value={submission.metadata?.referralSource ?? '—'} />
          <Metadata label="Created" value={formatTimestamp(submission.createdAt)} />
          <Metadata label="Updated" value={formatTimestamp(submission.updatedAt)} />
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
        <article className="space-y-4 rounded-[28px] border border-white/10 bg-gradient-to-br from-[#0f1014]/95 via-[#121317]/90 to-[#15161b]/95 p-6 text-sm text-slate-200/85 shadow-[0_28px_72px_rgba(9,10,14,0.55)] backdrop-blur-2xl">
          <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">Next steps</h3>
          <ul className="space-y-3 text-sm text-slate-300/90">
            <li className="flex items-start gap-3">
              <CheckCircle className="mt-1 h-4 w-4 text-white/60" />
              <span>Schedule discovery call with {submission.metadata?.clientName ?? 'client'}.</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle className="mt-1 h-4 w-4 text-white/60" />
              <span>Prepare recommendation on brand, campaign, or experience approach.</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle className="mt-1 h-4 w-4 text-white/60" />
              <span>Confirm investment posture and align the key launch moment.</span>
            </li>
          </ul>
        </article>
      </section>
    </div>
  )
}

function Metadata({ label, value, asRow = true }) {
  return (
    <div
      className={clsx(
        'flex gap-4 text-slate-300/90',
        asRow ? 'items-center justify-between' : 'flex-col items-start'
      )}
    >
      <span className="text-[11px] uppercase tracking-[0.28em] text-slate-500">{label}</span>
      <span className="text-sm font-medium text-slate-200">{value || '—'}</span>
    </div>
  )
}

function formatTimestamp(value) {
  const date = new Date(value)
  return date.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}
