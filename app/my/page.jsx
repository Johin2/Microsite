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
        <p className="text-sm text-slate-300/85">Signed in as {user.email}</p>
      </header>

      {submissions.length === 0 ? (
        <div className="rounded-[28px] border border-white/10 bg-white/5 p-8 text-sm text-slate-400">
          No projects found for your account.
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {submissions.map((s, index) => (
            <article key={s.id} className="group rounded-[28px] border border-white/10 bg-white/10 p-6 shadow-[0_28px_70px_rgba(9,10,14,0.5)]">
              <header className="flex items-start justify-between">
                <h2 className="text-xl font-semibold text-white">{s.metadata?.projectTitle ?? s.name}</h2>
                <span className="rounded-full bg-white/5 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-400">#{index + 1}</span>
              </header>
              <div className="mt-3 flex items-center gap-3 text-xs text-slate-400">
                <StatusPill status={s.status} />
                <span>Submitted {formatDate(s.createdAt)}</span>
              </div>
              <p className="mt-3 line-clamp-3 text-sm text-slate-300/90">{s.details}</p>
              <div className="mt-4 text-xs text-slate-400">
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
  const d = new Date(value)
  return d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })
}
