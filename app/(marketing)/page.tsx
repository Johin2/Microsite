import Link from 'next/link'

const highlights = [
  {
    title: 'Intake to Insight',
    description: 'Collect project requests and transform them into structured briefs in seconds.'
  },
  {
    title: 'Agentic Planning',
    description: 'Classifier, planner, and estimator agents build scoped roadmaps with acceptance criteria.'
  },
  {
    title: 'Autonomous Repair',
    description: 'CI-aware repair loop proposes patches, validates them, and stops when guardrails trigger.'
  }
]

export default function MarketingPage() {
  return (
    <main className="space-y-20">
      <section className="grid gap-8 lg:grid-cols-[2fr_3fr]">
        <div className="space-y-6">
          <h1 className="text-4xl font-semibold tracking-tight text-white lg:text-5xl">
            Microsite for Project Intake → Auto-Plan → Track → Auto-Fix
          </h1>
          <p className="text-lg text-slate-300">
            Launch a self-healing delivery pipeline that routes project requests through a team of
            specialized AI agents. Generate actionable plans, track execution, and automatically
            repair failures until your CI is green.
          </p>
          <div className="flex gap-4">
            <Link className="bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground" href="/new">
              Start a Project
            </Link>
            <Link className="px-6 py-3 text-sm font-semibold text-slate-300" href="/(app)/dashboard">
              View Dashboard
            </Link>
          </div>
        </div>
        <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6 shadow-xl backdrop-blur">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-primary">
            Agent Roster
          </h2>
          <ul className="mt-4 space-y-3 text-sm text-slate-300">
            <li>• Intake → Classification → Planning → Estimation</li>
            <li>• Tracker keeps the board in sync with Supabase</li>
            <li>• DevOps Runner drives CI + Preview deployments</li>
            <li>• QA/Test + Triage feed the Auto-Repair loop</li>
            <li>• Guardrails enforce safe patches and escalation</li>
          </ul>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        {highlights.map((item) => (
          <article key={item.title} className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
            <h3 className="text-lg font-semibold text-white">{item.title}</h3>
            <p className="mt-3 text-sm text-slate-300">{item.description}</p>
          </article>
        ))}
      </section>

      <section className="rounded-3xl border border-slate-800 bg-slate-900/40 p-8">
        <h2 className="text-2xl font-semibold text-white">How it Works</h2>
        <ol className="mt-6 grid gap-4 text-sm text-slate-300 md:grid-cols-2 lg:grid-cols-4">
          <li className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            Intake captures raw requests, normalizes them, and asks clarifying questions.
          </li>
          <li className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            Classify + plan with measurable milestones, acceptance tests, and risk markers.
          </li>
          <li className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            Supabase-backed tracker keeps the team dashboard, burndown, and digests current.
          </li>
          <li className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            Auto-repair loop executes patches under guardrails until QA reports green.
          </li>
        </ol>
      </section>
    </main>
  )
}
