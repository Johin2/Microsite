import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@lib/supabase'
import { findSubmission } from '@lib/submission-store'
import { ProjectTypeBadge } from '@components/ProjectTypeBadge'
import { StatusPill } from '@components/StatusPill'

export const dynamic = 'force-dynamic'

export default async function MyProjectDetailsPage({ params }) {
  const supabase = createServerSupabaseClient()
  const { data } = await supabase.auth.getUser()
  const user = data?.user ?? null
  if (!user?.email) {
    redirect(`/sign-in?next=/my/${params.id}`)
  }

  const submission = await findSubmission(params.id)
  if (!submission) {
    notFound()
  }

  // Only the owner email can view their submission
  if ((submission.email || '').toLowerCase() !== user.email.toLowerCase()) {
    notFound()
  }

  return (
    <div className="space-y-12">
      <header className="relative overflow-hidden rounded-[32px] border border-white/10 bg-white/10 p-8 shadow-[0_34px_82px_rgba(9,10,14,0.55)] backdrop-blur-2xl">
        <div className="absolute inset-x-0 top-0 h-28 bg-[radial-gradient(circle_at_top,_rgba(245,245,245,0.14),_transparent_70%)]" aria-hidden="true" />
        <div className="relative flex flex-wrap items-start justify-between gap-6">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Your project</p>
            <h1 className="text-3xl font-semibold text-white">{submission.metadata?.projectTitle ?? submission.name}</h1>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
              <StatusPill status={submission.status} />
              <ProjectTypeBadge type={submission.metadata?.projectType ?? 'other'} />
            </div>
          </div>
          <Link href="/my" className="text-sm font-semibold text-primary">
            ← Back to My Projects
          </Link>
        </div>
      </header>

      <section className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <article className="rounded-[28px] border border-white/10 bg-white/10 p-6 text-sm text-slate-200/90 shadow-[0_28px_72px_rgba(9,10,14,0.55)] backdrop-blur-2xl">
          <h2 className="text-lg font-semibold text-white">Submission details</h2>
          <p className="mt-4 whitespace-pre-line leading-relaxed text-slate-300/90">{submission.details}</p>
        </article>
        <article className="space-y-4 rounded-[28px] border border-white/10 bg-white/10 p-6 text-sm text-slate-200/90 shadow-[0_28px_72px_rgba(9,10,14,0.55)] backdrop-blur-2xl">
          <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">Project metadata</h3>
          <Meta label="Email" value={submission.email} />
          <Meta label="Timeline" value={submission.metadata?.timeline ?? '—'} />
          <Meta label="Investment" value={submission.metadata?.budget ?? '—'} />
          <Meta label="Key moment" value={submission.metadata?.keyMoment ?? '—'} />
          <Meta label="Submitted" value={formatTimestamp(submission.createdAt)} />
          <Meta label="Updated" value={formatTimestamp(submission.updatedAt)} />
        </article>
      </section>

      <section className="rounded-[28px] border border-white/10 bg-white/10 p-6 text-sm text-slate-200/90 shadow-[0_28px_72px_rgba(9,10,14,0.55)] backdrop-blur-2xl">
        <h2 className="text-lg font-semibold text-white">Reference links</h2>
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
          <p className="mt-4 text-xs text-slate-500">No reference links provided.</p>
        )}
      </section>
    </div>
  )
}

function Meta({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 text-slate-300/90">
      <span className="text-[11px] uppercase tracking-[0.28em] text-slate-500">{label}</span>
      <span className="text-sm font-medium text-slate-200">{value || '—'}</span>
    </div>
  )
}

function formatTimestamp(value) {
  const date = new Date(value)
  return date.toLocaleString(undefined, { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

