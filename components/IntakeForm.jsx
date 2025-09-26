'use client'

import clsx from 'clsx'
import Link from 'next/link'
import { cloneElement, isValidElement, useState } from 'react'

const defaultForm = {
  clientName: '',
  company: '',
  email: '',
  phone: '',
  projectTitle: '',
  projectType: '',
  timeline: '',
  budget: '',
  projectDescription: '',
  keyMoment: '',
  references: '',
  additionalNotes: '',
  referralSource: ''
}

const guidance = [
  'Share the business inflection point and what success looks like when this launches.',
  'Flag critical market windows, priority channels, and executives joining approvals.',
  'Link brand systems, research, or inspiration decks so we calibrate tone instantly.'
]

export function IntakeForm() {
  const [form, setForm] = useState(defaultForm)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [submission, setSubmission] = useState(null)

  async function submit(event) {
    event.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.projectTitle || form.clientName || 'Untitled engagement',
          email: form.email,
          details: form.projectDescription,
          metadata: {
            clientName: form.clientName || null,
            company: form.company || null,
            phone: form.phone || null,
            projectTitle: form.projectTitle || null,
            projectType: form.projectType || null,
            timeline: form.timeline || null,
            budget: form.budget || null,
            keyMoment: form.keyMoment || null,
            additionalNotes: form.additionalNotes || null,
            referralSource: form.referralSource || null,
            references: parseReferences(form.references)
          }
        })
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => null)
        const message = payload && typeof payload === 'object' && 'error' in payload ? payload.error : null
        throw new Error(message ?? 'Failed to submit project')
      }

      const payload = await response.json()
      setSubmission(payload.submission)
      setForm(defaultForm)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit project')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-16">
      <header className="space-y-4 text-center">
        <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-5 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-white/70">
          Glassbox studio intake
        </span>
        <h1 className="text-4xl font-semibold leading-tight text-white sm:text-5xl">
          Tell us about the launch you want to see
        </h1>
        <p className="mx-auto max-w-2xl text-sm text-white/70">
          A few considered details help us assemble the right strategists, designers, and producers. Expect a tailored response within one business day.
        </p>
      </header>

      <form onSubmit={submit} className="space-y-10">
        <FormBlock
          title="Client information"
          description="Introduce your team so we know who to align with during discovery."
        >
          <div className="grid gap-6 md:grid-cols-2">
            <Field label="Full name" required>
              <input
                required
                value={form.clientName}
                onChange={(event) => setForm((prev) => ({ ...prev, clientName: event.target.value }))}
                placeholder="Aarav Mehta"
              />
            </Field>
            <Field label="Company" hint="Optional">
              <input
                value={form.company}
                onChange={(event) => setForm((prev) => ({ ...prev, company: event.target.value }))}
                placeholder="Glassbox Ventures"
              />
            </Field>
            <Field label="Email" required>
              <input
                required
                type="email"
                value={form.email}
                onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                placeholder="you@brandgroup.com"
              />
            </Field>
            <Field label="Phone" hint="Include country code">
              <input
                value={form.phone}
                onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
                placeholder="+91 98 1234 5678"
              />
            </Field>
          </div>
        </FormBlock>

        <FormBlock
          title="Project blueprint"
          description="Outline the initiative so we can scope team composition, timeline, and investment."
        >
          <div className="grid gap-6 md:grid-cols-2">
            <Field label="Project title" required>
              <input
                required
                value={form.projectTitle}
                onChange={(event) => setForm((prev) => ({ ...prev, projectTitle: event.target.value }))}
                placeholder="Aurora residences global reveal"
              />
            </Field>
            <Field label="Project type" hint="Brand, campaign, digital, retail…">
              <input
                value={form.projectType}
                onChange={(event) => setForm((prev) => ({ ...prev, projectType: event.target.value }))}
                placeholder="Global brand + flagship experience"
              />
            </Field>
            <Field label="Ideal timeline" hint="Discovery, launch, or key milestones">
              <input
                value={form.timeline}
                onChange={(event) => setForm((prev) => ({ ...prev, timeline: event.target.value }))}
                placeholder="Discovery in July • Launch during Diwali"
              />
            </Field>
            <Field label="Investment posture" hint="Optional budget guidance">
              <input
                value={form.budget}
                onChange={(event) => setForm((prev) => ({ ...prev, budget: event.target.value }))}
                placeholder="₹3–4 Cr integrated campaign"
              />
            </Field>
          </div>
          <Field
            label="Project narrative"
            required
            hint="Goals, audience, success metrics, decision makers."
          >
            <textarea
              required
              rows={6}
              value={form.projectDescription}
              onChange={(event) => setForm((prev) => ({ ...prev, projectDescription: event.target.value }))}
              placeholder="Outline the ambition, the moments you must own, decision makers involved, and what success unlocks."
              className="min-h-[180px]"
            />
          </Field>
        </FormBlock>

        <FormBlock
          title="Context & artefacts"
          description="Share touchstones that help us prepare the right POV before our first call."
        >
          <div className="grid gap-6 md:grid-cols-2">
            <Field label="Key moment" hint="Launch date, event, or campaign window">
              <input
                type="date"
                value={form.keyMoment}
                onChange={(event) => setForm((prev) => ({ ...prev, keyMoment: event.target.value }))}
              />
            </Field>
            <Field label="Reference links" hint="Paste URLs separated by commas">
              <input
                value={form.references}
                onChange={(event) => setForm((prev) => ({ ...prev, references: event.target.value }))}
                placeholder="https://brandbook.com, https://moodboard.io/..."
              />
            </Field>
          </div>
          <Field label="Additional requirements" hint="Integrations, experiential needs, or quick notes">
            <textarea
              rows={4}
              value={form.additionalNotes}
              onChange={(event) => setForm((prev) => ({ ...prev, additionalNotes: event.target.value }))}
              placeholder="Mention any must-have channels, tech stack preferences, or on-ground activations we should plan for."
            />
          </Field>
          <Field label="How did you hear about us?" hint="Optional">
            <input
              value={form.referralSource}
              onChange={(event) => setForm((prev) => ({ ...prev, referralSource: event.target.value }))}
              placeholder="Referred by Ananya Sharma / Vogue Business feature"
            />
          </Field>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-white/70">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/50">What helps us prepare</p>
            <ul className="mt-3 space-y-2">
              {guidance.map((tip) => (
                <li key={tip} className="flex items-start gap-3">
                  <span className="mt-1 h-2 w-2 flex-none rounded-full bg-white/60" aria-hidden="true" />
                  <p className="leading-relaxed">{tip}</p>
                </li>
              ))}
            </ul>
          </div>
        </FormBlock>

        <div className="flex flex-wrap items-center justify-between gap-4 rounded-[28px] border border-white/10 bg-white/5 px-6 py-5 backdrop-blur-xl">
          <p className="text-xs text-white/60">
            Our concierge will connect within one business day with next steps and scheduling options.
          </p>
          <div className="flex items-center gap-3">
            {error ? <p className="text-sm text-rose-400">{error}</p> : null}
            <button type="submit" disabled={loading} className="min-w-[200px] justify-center">
              {loading ? 'Preparing concierge…' : 'Submit engagement request'}
            </button>
          </div>
        </div>
      </form>

      <aside className="rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
        <header className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/60">Engagement status</p>
          <h2 className="text-lg font-semibold text-white">Your request timeline</h2>
          <p className="text-sm text-white/60">
            Track which stage we are in and share the reference ID with your leadership team.
          </p>
        </header>

        {submission ? (
          <div className="mt-6 space-y-6 text-sm text-white/75">
            <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.28em] text-white/50">Request ID</p>
              <p className="mt-2 font-mono text-sm text-white">{submission.id}</p>
            </div>
            <div className="grid gap-3 text-xs text-white/60">
              <DetailRow label="Status" value={submission.status} />
              <DetailRow label="Primary contact" value={submission.email} />
              <DetailRow label="Project" value={submission.metadata?.projectTitle ?? '—'} />
              <DetailRow label="Investment" value={submission.metadata?.budget ?? '—'} />
              <DetailRow label="Key moment" value={submission.metadata?.keyMoment ?? '—'} />
            </div>
            {Array.isArray(submission.metadata?.references) && submission.metadata.references.length ? (
              <div className="rounded-2xl border border-white/8 bg-white/5 p-4 text-xs text-white/70">
                <p className="font-semibold text-white">Reference links</p>
                <ul className="mt-2 space-y-1">
                  {submission.metadata.references.map((item, index) => (
                    <li key={`${item.url}-${index}`} className="truncate">
                      <a className="text-primary" href={item.url} target="_blank" rel="noreferrer">
                        {item.name || item.url}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            <div className="space-y-2 text-xs text-white/60">
              <p className="font-semibold text-white">Project narrative</p>
              <div className="max-h-48 overflow-auto rounded-2xl border border-white/8 bg-[#0b0c10] p-4 text-[11px] leading-relaxed">
                {submission.details}
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-6 space-y-4 text-xs text-white/60">
            <p className="rounded-2xl border border-dashed border-white/12 bg-white/5 p-5 text-white/70">
              Once submitted, this panel surfaces producer assignments, scheduled touchpoints, and shared artefacts.
            </p>
            <p>
              Need inspiration in the meantime? Explore our{' '}
              <Link href="/projects" className="underline">
                active portfolio
              </Link>{' '}
              or the{' '}
              <Link href="/dashboard" className="underline">
                studio dashboard
              </Link>
              to see how engagements move from brief to launch.
            </p>
          </div>
        )}
      </aside>
    </div>
  )
}

function FormBlock({ title, description, children }) {
  return (
    <section className="rounded-[28px] border border-white/10 bg-white/5 p-8 shadow-[0_28px_72px_rgba(9,10,14,0.5)] backdrop-blur-2xl">
      <header className="space-y-2">
        <h2 className="text-xl font-semibold text-white">{title}</h2>
        <p className="text-sm text-white/60">{description}</p>
      </header>
      <div className="mt-8 space-y-6">{children}</div>
    </section>
  )
}

function Field({ label, hint, children, required }) {
  const control =
    isValidElement(children)
      ? cloneElement(children, {
          className: clsx('w-full', children.props.className),
        })
      : children

  return (
    <label className="flex flex-col gap-2">
      <span className="text-[11px] font-semibold uppercase tracking-[0.26em] text-white/70">
        {label}
        {required ? <span className="text-white/50"> *</span> : null}
      </span>
      {hint ? <span className="text-xs text-white/50">{hint}</span> : null}
      {control}
    </label>
  )
}

function DetailRow({ label, value }) {
  return (
    <p className="flex items-center justify-between gap-4 text-white/70">
      <span className="text-[11px] uppercase tracking-[0.28em] text-white/40">{label}</span>
      <span className="text-sm font-medium text-white/80">{value}</span>
    </p>
  )
}

function parseReferences(value) {
  if (!value.trim()) return []
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .map((url, index) => ({ url, name: `Reference ${index + 1}` }))
}
