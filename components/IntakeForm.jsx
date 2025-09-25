'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const defaultForm = {
  title: '',
  description: '',
  ownerEmail: '',
  categoryHint: '',
  dueDate: '',
  attachments: ''
}

export function IntakeForm() {
  const router = useRouter()
  const [form, setForm] = useState(defaultForm)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [preview, setPreview] = useState(null)

  async function submit(event) {
    event.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          ownerEmail: form.ownerEmail || undefined,
          categoryHint: form.categoryHint || undefined,
          dueDate: form.dueDate || undefined,
          attachments: parseAttachments(form.attachments)
        })
      })

      if (!response.ok) {
        const payload = await response.json()
        throw new Error(payload.error ?? 'Failed to create project')
      }

      const payload = await response.json()
      setPreview(payload)
      router.push(`/(app)/projects/${payload.projectId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[3fr_2fr]">
      <form onSubmit={submit} className="space-y-6 rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
        <header>
          <h1 className="text-2xl font-semibold text-white">New Project Intake</h1>
          <p className="text-sm text-slate-400">Capture the basics—we will auto-plan the rest.</p>
        </header>

        <Field label="Title">
          <input
            required
            value={form.title}
            onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
            placeholder="Build onboarding microsite"
          />
        </Field>

        <Field label="Description">
          <textarea
            required
            rows={6}
            value={form.description}
            onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
            placeholder="Describe goals, deliverables, constraints, and any context"
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Owner Email">
            <input
              type="email"
              value={form.ownerEmail}
              onChange={(event) => setForm((prev) => ({ ...prev, ownerEmail: event.target.value }))}
              placeholder="product@company.com"
            />
          </Field>
          <Field label="Category Hint">
            <input
              value={form.categoryHint}
              onChange={(event) => setForm((prev) => ({ ...prev, categoryHint: event.target.value }))}
              placeholder="development"
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Due Date">
            <input
              type="date"
              value={form.dueDate}
              onChange={(event) => setForm((prev) => ({ ...prev, dueDate: event.target.value }))}
            />
          </Field>
          <Field label="Attachments (comma-separated URLs)">
            <input
              value={form.attachments}
              onChange={(event) => setForm((prev) => ({ ...prev, attachments: event.target.value }))}
              placeholder="https://spec.pdf, https://figma.com/..."
            />
          </Field>
        </div>

        <div className="flex items-center gap-3">
          <button type="submit" disabled={loading}>
            {loading ? 'Submitting…' : 'Submit & Auto-Plan'}
          </button>
          {error ? <p className="text-sm text-rose-400">{error}</p> : null}
        </div>
      </form>

      <aside className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/20 p-6">
        <h2 className="text-lg font-semibold text-white">AI Extraction Preview</h2>
        {preview ? (
          <div className="space-y-3 text-xs text-slate-300">
            <p className="text-sm text-slate-200">Project ID: {preview.projectId}</p>
            <pre className="max-h-[22rem] overflow-auto rounded-xl border border-slate-800 bg-slate-950 p-4 text-[11px] leading-relaxed text-slate-300">
              {JSON.stringify(preview.brief, null, 2)}
            </pre>
          </div>
        ) : (
          <p className="text-sm text-slate-500">
            Submit the form to generate a brief, classification, plan, and initial tracker automatically.
          </p>
        )}
      </aside>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <label className="flex flex-col gap-2 text-sm text-slate-300">
      <span className="font-medium text-slate-200">{label}</span>
      {children}
    </label>
  )
}

function parseAttachments(value) {
  if (!value.trim()) return []
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .map((url, index) => ({ url, name: `Attachment ${index + 1}` }))
}
