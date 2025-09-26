import Link from 'next/link'
import { notFound } from 'next/navigation'

import { findSubmission } from '@lib/submission-store'

export const dynamic = 'force-dynamic'

export default async function ProjectPlanPage({ params }) {
  const submission = await findSubmission(params.id)

  if (!submission) {
    notFound()
  }

  return (
    <div className="space-y-10">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-3">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-400">
            Planning preview
          </span>
          <h1 className="text-3xl font-semibold text-white">
            Plan • {submission.metadata?.projectTitle ?? submission.name}
          </h1>
          <p className="text-sm text-slate-300/85">
            Automated planning is disabled in this simplified workspace, but the full system spins briefs into milestones, tasks, and acceptance criteria powered by dedicated agents.
          </p>
        </div>
        <Link
          href={`/projects/${submission.id}`}
          className="rounded-full border border-white/15 px-5 py-2 text-sm font-semibold text-slate-200 transition hover:border-white/30 hover:text-white"
        >
          ← Back to Project
        </Link>
      </header>

      <section className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <article className="rounded-[28px] border border-white/10 bg-white/10 p-6 text-sm text-slate-200/90 shadow-[0_28px_72px_rgba(9,10,14,0.55)] backdrop-blur-2xl">
          <h2 className="text-lg font-semibold text-white">How the planner behaves</h2>
          <ul className="mt-4 space-y-3 text-slate-300/90">
            <li className="flex items-start gap-3">
              <span className="mt-1 h-2 w-2 flex-none rounded-full bg-white/60" aria-hidden="true" />
              <p>Synthesizes milestones with dependencies, owners, and testable acceptance criteria.</p>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-1 h-2 w-2 flex-none rounded-full bg-white/60" aria-hidden="true" />
              <p>Generates repo scaffolding proposals, integration touchpoints, and risk narratives.</p>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-1 h-2 w-2 flex-none rounded-full bg-white/60" aria-hidden="true" />
              <p>Feeds downstream agents with structured tasks so estimators, trackers, and repair loops stay aligned.</p>
            </li>
          </ul>
        </article>
        <article className="rounded-[28px] border border-white/10 bg-gradient-to-br from-[#0f1014]/95 via-[#121317]/90 to-[#15161b]/95 p-6 text-sm text-slate-200/85 shadow-[0_28px_72px_rgba(9,10,14,0.55)] backdrop-blur-2xl">
          <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">Enable full workflow</h3>
          <p className="mt-4 leading-relaxed text-slate-300/85">
            Deploy the complete microsite to Vercel with Supabase connected and the orchestrator enabled. Once plumbed in, the plan view will show generated milestones, timeline heatmaps, and auto-repair attempts per task.
          </p>
        </article>
      </section>
    </div>
  )
}
