'use client'

import { useEffect, useState } from 'react'

import { StatusPill } from '@components/StatusPill'

// This route is team-only; server redirect is handled by Dashboard/Projects pages.
// The Review page is client-side, so we keep content minimal and rely on server-side guards
// on the list/detail pages. Optionally, migrate this to a server page to enforce auth.
export default function ReviewPage() {
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [actionError, setActionError] = useState(null)
  const [processingId, setProcessingId] = useState(null)

  useEffect(() => {
    let isMounted = true

    async function load() {
      setLoading(true)
      try {
        const response = await fetch('/api/submissions')
        if (!response.ok) {
          throw new Error('Failed to load submissions')
        }
        const payload = await response.json()
        if (isMounted) {
          setSubmissions(payload.submissions ?? [])
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to load submissions')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    load()
    return () => {
      isMounted = false
    }
  }, [])

  async function handleDecision(id, status) {
    setActionError(null)
    setProcessingId(id)

    try {
      const response = await fetch(`/api/submissions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => null)
        const message = payload && typeof payload === 'object' && 'error' in payload ? payload.error : null
        throw new Error(typeof message === 'string' ? message : 'Unable to update submission')
      }

      const payload = await response.json()

      setSubmissions((current) =>
        current.map((submission) => (submission.id === id ? payload.submission : submission))
      )
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Unable to update submission')
    } finally {
      setProcessingId(null)
    }
  }

  return (
    <main className="space-y-10">
      <header className="relative overflow-hidden rounded-[32px] border border-white/10 bg-white/10 p-8 shadow-[0_34px_82px_rgba(9,10,14,0.55)] backdrop-blur-2xl">
        <div className="absolute inset-x-0 top-0 h-28 bg-[radial-gradient(circle_at_top,_rgba(245,245,245,0.14),_transparent_70%)]" aria-hidden="true" />
        <div className="relative space-y-4">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary/15 px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-primary/80">
            Review Console
          </span>
          <h1 className="text-3xl font-semibold text-white">Submission Review</h1>
          <p className="max-w-3xl text-sm text-slate-300/90">
            Inspect project requests, confirm details, and move them into the delivery pipeline. Approving an item makes it visible on the projects page.
          </p>
        </div>
      </header>

      {loading ? (
        <p className="text-sm text-slate-400">Loading submissions…</p>
      ) : error ? (
        <p className="text-sm text-rose-400">{error}</p>
      ) : submissions.length === 0 ? (
        <div className="rounded-[28px] border border-dashed border-white/15 bg-white/5 p-8 text-sm text-slate-400">
          No submissions yet. Once requests are submitted, they will appear here for review.
        </div>
      ) : (
        <section className="grid gap-6 xl:grid-cols-2">
          {submissions.map((submission) => (
            <article
              key={submission.id}
              className="group relative overflow-hidden rounded-[28px] border border-white/10 bg-white/10 p-6 shadow-[0_28px_72px_rgba(9,10,14,0.55)] transition duration-300 hover:border-white/20 hover:shadow-[0_36px_96px_rgba(9,10,14,0.62)]"
            >
              <div className="absolute right-6 top-6 h-10 w-10 rounded-full bg-white/10 blur-2xl opacity-0 transition duration-300 group-hover:opacity-100" aria-hidden="true" />
              <header className="relative flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-3">
                  <h2 className="text-lg font-semibold text-white">
                    {submission.metadata?.projectTitle ?? submission.name}
                  </h2>
                  <p className="text-xs text-slate-400">
                    {submission.metadata?.clientName ? `${submission.metadata.clientName} • ` : ''}
                    {submission.email}
                  </p>
                </div>
                <StatusPill status={submission.status} />
              </header>

              <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-slate-200/90">{submission.details}</p>

              <div className="mt-6 space-y-2 text-xs text-slate-400">
                {submission.metadata?.projectType ? <p>Project type: {submission.metadata.projectType}</p> : null}
                {submission.metadata?.budget ? <p>Investment: {submission.metadata.budget}</p> : null}
                {submission.metadata?.keyMoment ? <p>Key moment: {submission.metadata.keyMoment}</p> : null}
                {Array.isArray(submission.metadata?.references) && submission.metadata.references.length ? (
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Reference links</p>
                    <ul className="mt-2 space-y-1 text-xs">
                      {submission.metadata.references.map((file, index) => (
                        <li key={`${file.url}-${index}`} className="truncate">
                          <a className="text-primary" href={file.url} target="_blank" rel="noreferrer">
                            {file.name || file.url}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>

              <footer className="mt-6 flex flex-wrap items-center gap-4 text-xs text-slate-500">
                <p>Submitted {new Date(submission.createdAt).toLocaleString()}</p>
                <p>Updated {new Date(submission.updatedAt).toLocaleString()}</p>
              </footer>

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  disabled={submission.status !== 'pending' || processingId === submission.id}
                  onClick={() => handleDecision(submission.id, 'accepted')}
                  className="min-w-[140px] justify-center"
                >
                  Accept
                </button>
                <button
                  type="button"
                  disabled={submission.status !== 'pending' || processingId === submission.id}
                  onClick={() => handleDecision(submission.id, 'rejected')}
                  className="min-w-[140px] justify-center bg-gradient-to-br from-rose-500/80 via-rose-500/70 to-rose-600/70 text-rose-50 shadow-[0_15px_40px_rgba(244,63,94,0.3)] hover:shadow-[0_20px_60px_rgba(244,63,94,0.4)]"
                >
                  Reject
                </button>
              </div>
            </article>
          ))}
        </section>
      )}

      {actionError ? <p className="text-sm text-rose-400">{actionError}</p> : null}
    </main>
  )
}
