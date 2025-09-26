'use client'

import { useState } from 'react'

const emptyForm = {
  name: '',
  email: '',
  details: ''
}

const highlights = [
  {
    title: 'Strategic start',
    description: 'One intake unlocks positioning workshops, competitor insight, and a narrative tailored to the boardroom.'
  },
  {
    title: 'Executive visibility',
    description: 'We curate milestones, approvals, and artefacts so stakeholders see progress—not chaos.'
  },
  {
    title: 'Flawless rollouts',
    description: 'Testing and launch orchestration ensure your brand moments perform from flagship store to microsite.'
  }
]

export default function HomePage() {
  const [form, setForm] = useState(emptyForm)
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [submissionId, setSubmissionId] = useState(null)

  function handleChange(field) {
    return (event) => {
      setForm((previous) => ({ ...previous, [field]: event.target.value }))
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => null)
        const message = payload && typeof payload === 'object' && 'error' in payload ? payload.error : null
        throw new Error(typeof message === 'string' ? message : 'Failed to submit project')
      }

      const payload = await response.json()

      setSubmitted(true)
      setSubmissionId(payload.submission.id)
      setForm(emptyForm)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit project')
      setSubmitted(false)
      setSubmissionId(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="space-y-16">
      <section className="relative overflow-hidden rounded-[40px] border border-white/10 bg-gradient-to-br from-[#0f1014]/95 via-[#121317]/90 to-[#15161b]/95 p-10 shadow-[0_40px_90px_rgba(9,10,14,0.6)] backdrop-blur-2xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(245,245,245,0.14),_transparent_60%)]" aria-hidden="true" />
        <div className="relative grid gap-10 lg:grid-cols-[1.4fr_1fr]">
          <div className="space-y-8">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/15 px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.32em] text-primary/80">
              Signature engagements
            </span>
            <h1 className="text-4xl font-semibold leading-[1.05] text-white sm:text-5xl">
              Commission a flagship brand experience
            </h1>
            <p className="max-w-2xl text-base text-slate-200/90">
              Share your vision once. Our strategists, designers, and storytellers craft the launch plan, keep you briefed, and deliver assets that travel from press kit to product reveal.
            </p>
            <div className="grid gap-4 sm:grid-cols-3">
              {highlights.map((item) => (
                <div
                  key={item.title}
                  className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-slate-200/90 shadow-[0_24px_48px_rgba(9,10,14,0.45)] transition duration-300 hover:border-white/20 hover:shadow-[0_28px_72px_rgba(9,10,14,0.55)]"
                >
                  <p className="text-sm font-semibold text-white">{item.title}</p>
                  <p className="mt-2 text-xs leading-relaxed text-slate-300/85">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
          <form
            onSubmit={handleSubmit}
            className="relative flex flex-col gap-5 rounded-[28px] border border-white/10 bg-white/10 p-6 shadow-[0_28px_70px_rgba(9,10,14,0.55)] backdrop-blur-2xl"
            >
            <div className="absolute -top-16 right-1/4 h-32 w-32 rounded-full bg-white/10 blur-3xl" aria-hidden="true" />
            <h2 className="text-lg font-semibold text-white">Engagement request</h2>
            <label className="flex flex-col gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.26em] text-slate-400">Working title</span>
              <input
                required
                value={form.name}
                onChange={handleChange('name')}
                placeholder="Global rebrand launch"
              />
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.26em] text-slate-400">Primary contact</span>
              <input
                required
                type="email"
                value={form.email}
                onChange={handleChange('email')}
                placeholder="ceo@brandgroup.com"
              />
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.26em] text-slate-400">Project mandate</span>
              <textarea
                required
                rows={6}
                value={form.details}
                onChange={handleChange('details')}
                placeholder="Outline the ambition, market moments, and any must-hit dates."
                className="min-h-[140px]"
              />
            </label>
            <button type="submit" disabled={loading}>
              {loading ? 'Preparing concierge…' : 'Request consultation'}
            </button>
            {error ? <p className="text-sm text-rose-400">{error}</p> : null}
            {submitted ? (
              <div className="rounded-2xl border border-white/10 bg-[#0b0c10] p-4 text-sm text-slate-200/90">
                <p>Thanks for reaching out! Your project request is live for review.</p>
                {submissionId ? (
                  <p className="mt-2 text-xs text-slate-500">
                    Internal reference:{' '}
                    <code className="rounded bg-white/5 px-2 py-1 text-primary/80">{submissionId}</code>. Reviewers can manage it at{' '}
                    <a className="text-primary" href="/review">
                      /review
                    </a>
                    .
                  </p>
                ) : null}
              </div>
            ) : null}
          </form>
        </div>
      </section>
    </main>
  )
}
