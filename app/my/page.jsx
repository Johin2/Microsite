import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@lib/supabase'
import { listSubmissionsByEmail } from '@lib/submission-store'
import { StatusPill } from '@components/StatusPill'

export const dynamic = 'force-dynamic'

export default async function MyProjectsPage() {
  const supabase = createServerSupabaseClient()
  const { data } = await supabase.auth.getUser()
  const user = data?.user ?? null
  if (!user?.email) {
    redirect('/sign-in?audience=client&next=/my')
  }

  const submissions = await listSubmissionsByEmail(user.email)

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-white">My Projects</h1>
        <p className="text-sm text-neutral-300/85">Signed in as {user.email}</p>
      </header>

      {submissions.length === 0 ? (
        <div className="rounded-[28px] border border-white/10 bg-white/5 p-8 text-sm text-neutral-300/90">
          <p>No projects found for your account yet.</p>
          <p className="mt-3 text-neutral-400">
            Share your first campaign brief and we&apos;ll keep the status, files, and next steps organised here.
          </p>
          <Link
            href="/"
            className="mt-5 inline-flex items-center justify-center rounded-full border border-white/15 bg-white/90 px-5 py-2 text-sm font-semibold text-[#111216] shadow-sm transition hover:bg-white"
          >
            Submit a new brief
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {submissions.map((s, index) => (
            <article key={s.id} className="group rounded-[28px] border border-white/10 bg-white/10 p-6 shadow-[0_28px_70px_rgba(0,0,0,0.5)]">
              <header className="flex items-start justify-between">
                <h2 className="text-xl font-semibold text-white">{s.metadata?.projectTitle ?? s.name}</h2>
                <span className="rounded-full bg-white/5 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-neutral-400">#{index + 1}</span>
              </header>
              <div className="mt-3 flex items-center gap-3 text-xs text-neutral-400">
                <StatusPill status={s.status} />
                <span>Submitted {formatDate(s.createdAt)}</span>
              </div>
              <p className="mt-3 line-clamp-3 text-sm text-neutral-300/90">{s.details}</p>
              <div className="mt-4 text-xs text-neutral-400">
                {s.metadata?.keyMoment ? <p>Key moment: {s.metadata.keyMoment}</p> : null}
              </div>
              <Link href={`/my/${s.id}`} className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary">
                View details →
              </Link>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}

function formatDate(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) {
    return '—'
  }
  return d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })
}
