'use client'

import clsx from 'clsx'
import Link from 'next/link'
import { cloneElement, isValidElement, useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const defaultForm = {
  objectives: [],
  objectiveOther: '',
  campaignType: '',
  campaignTypeOther: '',
  demographics: '',
  psychographics: '',
  problemsSolved: '',
  painPoints: '',
  audienceTarget: '',
  personasFiles: [],
  audienceThinkFeel: '',
  audienceThinkFeelSecondary: '',
  deliverables: [],
  deliverablesOther: '',
  brandTone: [],
  brandToneOther: '',
  referenceCampaigns: [],
  ctaFocus: '',
  ctaOther: '',
  mandatoryAssets: [],
  brandGuidelines: [],
  packShots: [],
  budget: '',
  goLiveDate: '',
  successMetrics: [],
  successMetricsOther: '',
  generalNotes: ''
}

const objectiveOptions = [
  'Increase Brand Awareness',
  'Generate Leads',
  'Drive Website Traffic',
  'Boost Conversions',
  'Grow Social Media Engagement',
  'Promote a New Product or Service',
  'Strengthen Customer Loyalty / Retention',
  'Other'
]

const campaignTypeOptions = [
  'Product Launch',
  'Seasonal Campaign',
  'Interim Campaign',
  'Always-On Campaign',
  'Event-Based Campaign',
  'Promotional / Discount Campaign',
  'Other'
]

const audienceOptions = ['Existing Customers', 'New Prospects', 'Both']

const deliverableOptions = [
  'Social media – Static posts',
  'Social media – GIFs / animated posts',
  'Short-form video content (e.g., Reels, TikTok, Shorts)',
  'Long-form video content (e.g., YouTube, explainers)',
  'TVCs (Television Commercials) & Digital Films',
  'Display ads / web banners',
  'Print materials (posters, flyers, brochures)',
  'Outdoor ads (billboards, signage)',
  'Other'
]

const brandToneOptions = [
  'Professional',
  'Friendly',
  'Bold',
  'Playful',
  'Inspirational',
  'Premium',
  'Minimalist',
  'Other'
]

const ctaOptions = ['Awareness & Identity', 'Conversion & Sales', 'Other']

const successMetricOptions = [
  'Reach',
  'Impressions',
  'Brand Recall',
  'Engagement Rate',
  'Click-through rate (CTR)',
  'Leads generated (sign-ups, downloads, form fills)',
  'Conversion rate (purchases, bookings, sign-ups)',
  'Cost per acquisition (CPA)',
  'Return on ad spend (ROAS)',
  'Other'
]

function toggleValue(list, value) {
  if (list.includes(value)) {
    return list.filter((item) => item !== value)
  }
  return [...list, value]
}

function readFiles(fileList) {
  const files = Array.from(fileList ?? [])
  return Promise.all(
    files.map(
      (file) =>
        new Promise((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => {
            resolve({
              name: file.name,
              type: file.type,
              size: file.size,
              dataUrl: typeof reader.result === 'string' ? reader.result : null
            })
          }
          reader.onerror = () => reject(reader.error)
          reader.readAsDataURL(file)
        })
    )
  )
}

// Smooth auto-advance helpers
function focusFirstControl(el) {
  if (!el) return
  const target =
    el.querySelector('input, textarea, select, button') ||
    el
  if (target) {
    target.focus({ preventScroll: true })
  }
}

function advanceFrom(fieldId, step, goToStep, sectionsLen) {
  if (typeof window === 'undefined') return
  const currentField = document.querySelector(`[data-field="${fieldId}"]`)
  const sectionEl = currentField?.closest('[data-section]')
  if (!sectionEl) return

  const fields = Array.from(sectionEl.querySelectorAll('[data-field]'))
  const idx = fields.findIndex((n) => n.getAttribute('data-field') === fieldId)

  // try next field in the same section
  const nextField = fields[idx + 1]
  if (nextField) {
    nextField.scrollIntoView({ behavior: 'smooth', block: 'center' })
    // allow the scroll animation to start, then focus
    setTimeout(() => focusFirstControl(nextField), 180)
    return
  }

  // otherwise move to next section
  if (step < sectionsLen - 1) {
    goToStep(step + 1)
    // focus first field of next section after animates in
    setTimeout(() => {
      const nextSection = document.querySelector(`[data-section-index="${step + 1}"]`)
      const firstField = nextSection?.querySelector('[data-field]')
      if (firstField) {
        firstField.scrollIntoView({ behavior: 'smooth', block: 'start' })
        setTimeout(() => focusFirstControl(firstField), 180)
      }
    }, 220)
  }
}

export function IntakeForm() {
  const [form, setForm] = useState(defaultForm)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [submission, setSubmission] = useState(null)
  const [step, setStep] = useState(0)
  const [stepErrors, setStepErrors] = useState({})
  const [showSuccess, setShowSuccess] = useState(false)
  const [authRequired, setAuthRequired] = useState(false)
  const [draftReady, setDraftReady] = useState(false)
  const [signInHref, setSignInHref] = useState('/sign-in?audience=client&next=%2F')

  const sections = useMemo(
    () => [
      { key: 'objectives', title: 'Campaign objectives', description: 'Clarify the goal of this initiative so we align strategy and creative output.' },
      { key: 'audience', title: 'Audience & messaging', description: 'Help us understand who we are speaking to and what they should take away.' },
      { key: 'deliverables', title: 'Deliverables & logistics', description: 'Outline formats, guardrails, and launch timing so we can scope the work precisely.' }
    ],
    []
  )

  useEffect(() => {
    if (typeof window === 'undefined') return
    const next = `${window.location.pathname}${window.location.search}${window.location.hash}` || '/'
    setSignInHref(`/sign-in?audience=client&next=${encodeURIComponent(next)}`)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const stored = window.sessionStorage.getItem('intake-form-draft')
      if (stored) {
        const parsed = JSON.parse(stored)
        if (parsed && typeof parsed === 'object') {
          setForm((prev) => ({ ...prev, ...parsed }))
        }
      }
      const storedStep = window.sessionStorage.getItem('intake-form-step')
      if (storedStep !== null) {
        const parsedStep = Number.parseInt(storedStep, 10)
        if (!Number.isNaN(parsedStep)) {
          setStep((current) => {
            if (Number.isNaN(current)) return 0
            return Math.min(Math.max(parsedStep, 0), sections.length - 1)
          })
        }
      }
    } catch (err) {
      console.warn('Failed to restore intake form draft', err)
    } finally {
      setDraftReady(true)
    }
  }, [sections.length])

  useEffect(() => {
    if (!draftReady || typeof window === 'undefined') return
    try {
      const isDefault = JSON.stringify(form) === JSON.stringify(defaultForm)
      if (isDefault) {
        window.sessionStorage.removeItem('intake-form-draft')
      } else {
        window.sessionStorage.setItem('intake-form-draft', JSON.stringify(form))
      }
    } catch (err) {
      console.warn('Failed to persist intake form draft', err)
    }
  }, [form, draftReady])

  useEffect(() => {
    if (!draftReady || typeof window === 'undefined') return
    try {
      window.sessionStorage.setItem('intake-form-step', String(step))
    } catch (err) {
      console.warn('Failed to persist intake form step', err)
    }
  }, [step, draftReady])

  function goToStep(next) {
    setStepErrors({})
    setStep((current) => {
      if (next < 0) return 0
      if (next >= sections.length) return sections.length - 1
      return next
    })
  }

  // --- validation (pure checker) ---
  function getStepErrors(currentStep) {
    const errs = {}
    if (currentStep === 0) {
      if (!form.objectives.length) errs.objectives = 'Select at least one objective.'
      if (form.objectives.includes('Other') && !form.objectiveOther.trim()) errs.objectiveOther = 'Describe the other objective.'
      if (!form.campaignType.trim()) errs.campaignType = 'Select a campaign type.'
      if (form.campaignType === 'Other' && !form.campaignTypeOther.trim()) errs.campaignTypeOther = 'Describe the campaign type.'
      if (!form.ctaFocus.trim()) errs.ctaFocus = 'Select the CTA emphasis.'
      if (form.ctaFocus === 'Other' && !form.ctaOther.trim()) errs.ctaOther = 'Describe the CTA focus.'
    }
    if (currentStep === 1) {
      if (!form.demographics.trim()) errs.demographics = 'Describe the demographics.'
      if (!form.psychographics.trim()) errs.psychographics = 'Share the key psychographics.'
      if (!form.problemsSolved.trim()) errs.problemsSolved = 'Explain the problems you solve.'
      if (!form.painPoints.trim()) errs.painPoints = 'Detail the pain points to address.'
      if (!form.audienceTarget.trim()) errs.audienceTarget = 'Select the primary audience.'
      if (!form.audienceThinkFeel.trim()) errs.audienceThinkFeel = 'Share the desired takeaway.'
      if (!form.audienceThinkFeelSecondary.trim()) errs.audienceThinkFeelSecondary = 'Share the follow-up takeaway.'
    }
    if (currentStep === 2) {
      if (!form.deliverables.length) errs.deliverables = 'Select at least one deliverable.'
      if (form.deliverables.includes('Other') && !form.deliverablesOther.trim()) errs.deliverablesOther = 'Describe the other deliverables.'
      if (!form.brandTone.length) errs.brandTone = 'Select the desired tone.'
      if (form.brandTone.includes('Other') && !form.brandToneOther.trim()) errs.brandToneOther = 'Describe the additional tone.'
      // uploads optional
      if (!form.budget.trim()) errs.budget = 'Share the investment range or estimate.'
      if (!form.goLiveDate.trim()) errs.goLiveDate = 'Provide a go-live date.'
      if (!form.successMetrics.length) errs.successMetrics = 'Select at least one success metric.'
      if (form.successMetrics.includes('Other') && !form.successMetricsOther.trim()) errs.successMetricsOther = 'Describe the custom success metric.'
      if (!form.generalNotes.trim()) errs.generalNotes = 'Add any additional context.'
    }
    return errs
  }

  function validateStep(currentStep) {
    const errors = getStepErrors(currentStep)
    setStepErrors(errors)
    return Object.keys(errors).length === 0
  }

  function isAllComplete() {
    for (let i = 0; i < sections.length; i += 1) {
      if (Object.keys(getStepErrors(i)).length) return false
    }
    return true
  }

  function validateAll() {
    for (let i = 0; i < sections.length; i += 1) {
      const ok = Object.keys(getStepErrors(i)).length === 0
      if (!ok) {
        setStep(i)
        setStepErrors(getStepErrors(i))
        return false
      }
    }
    return true
  }

  function buildSummaryPayload() {
    const lines = [
      `Objectives: ${form.objectives.filter((item) => item !== 'Other').join(', ')}`,
      form.objectives.includes('Other') && form.objectiveOther.trim() ? `Objective (Other): ${form.objectiveOther.trim()}` : null,
      `Campaign type: ${form.campaignType === 'Other' ? form.campaignTypeOther.trim() || 'Other' : form.campaignType}`,
      `CTA focus: ${form.ctaFocus === 'Other' ? form.ctaOther.trim() || 'Other' : form.ctaFocus}`,
      `Audience: ${form.audienceTarget}`,
      `Deliverables: ${form.deliverables.filter((item) => item !== 'Other').join(', ')}`,
      form.deliverables.includes('Other') && form.deliverablesOther.trim() ? `Deliverables (Other): ${form.deliverablesOther.trim()}` : null,
      `Brand tone: ${form.brandTone.filter((item) => item !== 'Other').join(', ')}`,
      form.brandTone.includes('Other') && form.brandToneOther.trim() ? `Brand tone (Other): ${form.brandToneOther.trim()}` : null,
      `Budget: ${form.budget}`,
      `Go-live date: ${form.goLiveDate}`,
      `Success metrics: ${form.successMetrics.filter((item) => item !== 'Other').join(', ')}`,
      form.successMetrics.includes('Other') && form.successMetricsOther.trim() ? `Success metrics (Other): ${form.successMetricsOther.trim()}` : null
    ].filter(Boolean)
    return `${lines.join('\n')}`
  }

  async function submit(event) {
    event.preventDefault()
    setError(null)
    setShowSuccess(false)
    setAuthRequired(false)

    if (!validateAll()) return

    setLoading(true)

    const metadata = {
      objectives: form.objectives,
      objectiveOther: form.objectiveOther.trim() || null,
      campaignType: form.campaignType,
      campaignTypeOther: form.campaignTypeOther.trim() || null,
      demographics: form.demographics.trim(),
      psychographics: form.psychographics.trim(),
      problemsSolved: form.problemsSolved.trim(),
      painPoints: form.painPoints.trim(),
      audienceTarget: form.audienceTarget,
      personasFiles: form.personasFiles,
      audienceThinkFeel: form.audienceThinkFeel.trim(),
      audienceThinkFeelSecondary: form.audienceThinkFeelSecondary.trim(),
      deliverables: form.deliverables,
      deliverablesOther: form.deliverablesOther.trim() || null,
      brandTone: form.brandTone,
      brandToneOther: form.brandToneOther.trim() || null,
      referenceCampaigns: form.referenceCampaigns,
      ctaFocus: form.ctaFocus,
      ctaOther: form.ctaOther.trim() || null,
      mandatoryAssets: form.mandatoryAssets,
      brandGuidelines: form.brandGuidelines,
      packShots: form.packShots,
      budget: form.budget.trim(),
      goLiveDate: form.goLiveDate,
      successMetrics: form.successMetrics,
      successMetricsOther: form.successMetricsOther.trim() || null,
      generalNotes: form.generalNotes.trim()
    }

    try {
      const response = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.campaignType || 'Campaign brief',
          details: `${buildSummaryPayload()}\n\nGeneral notes:\n${form.generalNotes.trim()}`,
          metadata
        })
      })

      if (response.status === 401) {
        setAuthRequired(true)
        try {
          if (typeof window !== 'undefined') {
            window.sessionStorage.setItem('intake-form-draft', JSON.stringify(form))
          }
        } catch (err) {
          console.warn('Failed to persist draft before redirect prompt', err)
        }
        return
      }

      if (!response.ok) {
        const payload = await response.json().catch(() => null)
        const message = payload && typeof payload === 'object' && 'error' in payload ? payload.error : null
        throw new Error(message ?? 'Failed to submit campaign brief')
      }

      const payload = await response.json()
      setSubmission(payload.submission)
      setForm(defaultForm)
      setStep(sections.length - 1)
      setStepErrors({})
      setShowSuccess(true)
      setAuthRequired(false)
      try {
        if (typeof window !== 'undefined') {
          window.sessionStorage.removeItem('intake-form-draft')
          window.sessionStorage.removeItem('intake-form-step')
        }
      } catch (err) {
        console.warn('Failed to clear intake form draft after submission', err)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit campaign brief')
    } finally {
      setLoading(false)
    }
  }

  // allow free navigation via step bar if all sections complete
  const allComplete = isAllComplete()

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-16">
      <header className="space-y-4 text-center">
        <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-5 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-white/70">
          Campaign intake
        </span>
        <h1 className="text-4xl font-semibold leading-tight text-white sm:text-5xl">
          Brief us on Streamlining Your Workflow
        </h1>
        <p className="mx-auto max-w-2xl text-sm text-white/70">
          Share campaign objectives, audience insights, and required assets so we can orchestrate a focused launch plan within one business day.
        </p>
      </header>

      <Progress
        steps={sections}
        current={step}
        onNavigate={(index) => {
          // if everything valid, you can jump anywhere; otherwise only backwards or current
          if (allComplete || index <= step) {
            goToStep(index)
          } else if (validateStep(step) && index === step + 1) {
            goToStep(index)
          }
        }}
      />

      {showSuccess ? (
        <div className="rounded-[28px] border border-primary/20 bg-primary/10 p-8 text-center text-sm text-white/75">
          <h2 className="text-xl font-semibold text-white">Thanks for the download.</h2>
          <p className="mt-2">
            Our campaign pod is on it. Expect a follow-up email shortly with next steps and availability for kickoff.
          </p>
        </div>
      ) : null}

      <form onSubmit={submit} className="space-y-10">
        <AnimatePresence mode="wait">
          {step === 0 ? (
            <motion.div
              key="step-0"
              data-section
              data-section-index="0"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.22 }}
            >
              <ObjectivesSection
                form={form}
                setForm={setForm}
                errors={stepErrors}
                step={step}
                goToStep={goToStep}
                onAdvance={advanceFrom}
                sectionsLen={sections.length}
              />
            </motion.div>
          ) : null}

          {step === 1 ? (
            <motion.div
              key="step-1"
              data-section
              data-section-index="1"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.22 }}
            >
              <AudienceSection
                form={form}
                setForm={setForm}
                errors={stepErrors}
                step={step}
                goToStep={goToStep}
                onAdvance={advanceFrom}
                sectionsLen={sections.length}
              />
            </motion.div>
          ) : null}

          {step === 2 ? (
            <motion.div
              key="step-2"
              data-section
              data-section-index="2"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.22 }}
            >
              <DeliverablesSection
                form={form}
                setForm={setForm}
                errors={stepErrors}
                step={step}
                goToStep={goToStep}
                onAdvance={advanceFrom}
                sectionsLen={sections.length}
              />
            </motion.div>
          ) : null}
        </AnimatePresence>

        <div className="flex flex-wrap items-center justify-between gap-4 rounded-[28px] border border-white/10 bg-white/5 px-6 py-5 backdrop-blur-xl">
          <p className="text-xs text-white/60">
            Our campaign leads respond within one business day with the proposed approach and timeline.
          </p>
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-start gap-1 text-left">
              {authRequired ? (
                <div className="text-xs text-neutral-300">
                  <p className="font-semibold text-neutral-200">Sign in required</p>
                  <p>We saved your answers. Please sign in to submit your request.</p>
                </div>
              ) : null}
              {error ? <p className="text-sm text-neutral-300">{error}</p> : null}
            </div>
            <div className="flex items-center gap-2">
              {step > 0 ? (
                <button
                  type="button"
                  disabled={loading}
                  className="min-w-[120px] justify-center bg-white/20 text-white hover:bg-white/30"
                  onClick={() => goToStep(step - 1)}
                >
                  Back
                </button>
              ) : null}
              {step < sections.length - 1 ? (
                <button
                  type="button"
                  disabled={loading}
                  className="min-w-[160px] justify-center"
                  onClick={() => {
                    if (validateStep(step)) goToStep(step + 1)
                  }}
                >
                  Continue
                </button>
              ) : (
                <button type="submit" disabled={loading} className="min-w-[200px] justify-center">
                  {loading ? 'Submitting campaign brief…' : 'Submit campaign brief'}
                </button>
              )}
            </div>
          </div>
        </div>
      </form>

      {authRequired ? (
        <div className="rounded-[28px] border border-neutral-500/30 bg-neutral-500/10 p-6 text-sm text-neutral-100">
          <p className="font-semibold">Almost there — sign in to continue.</p>
          <p className="mt-2 text-neutral-200/80">
            We&apos;ve preserved your responses. Sign in below to submit without re-entering any details.
          </p>
          <Link
            href={signInHref}
            className="mt-4 inline-flex items-center justify-center rounded-full bg-neutral-200 px-5 py-2 text-sm font-semibold text-[#111216] hover:bg-neutral-300"
          >
            Sign in and finish submission
          </Link>
        </div>
      ) : null}

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
              <DetailRow label="Campaign type" value={submission.metadata?.campaignType ?? '—'} />
              <DetailRow label="Go-live date" value={submission.metadata?.goLiveDate ?? '—'} />
              <DetailRow label="Budget" value={submission.metadata?.budget ?? '—'} />
            </div>
            <div className="space-y-2 text-xs text-white/60">
              <p className="font-semibold text-white">Campaign narrative</p>
              <div className="max-h-48 overflow-auto rounded-2xl border border-white/8 bg-[#080808] p-4 text-[11px] leading-relaxed">
                {submission.details}
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-6 space-y-4 text-xs text-white/60">
            <p className="rounded-2xl border border-dashed border-white/12 bg-white/5 p-5 text-white/70">
              Once submitted, this panel surfaces producer assignments, scheduled touchpoints, and shared artefacts.
            </p>
          </div>
        )}
      </aside>
    </div>
  )
}

function FormBlock({ title, description, children }) {
  return (
    <section className="rounded-[28px] border border-white/10 bg-white/5 p-8 shadow-[0_28px_72px_rgba(0,0,0,0.5)] backdrop-blur-2xl">
      <header className="space-y-2">
        <h2 className="text-xl font-semibold text-white">{title}</h2>
        <p className="text-sm text-white/60">{description}</p>
      </header>
      <div className="mt-8 space-y-6">{children}</div>
    </section>
  )
}

// Neutral group wrapper (prevents hover bug)
function Field({ id, label, hint, children, required, error }) {
  const control =
    isValidElement(children)
      ? cloneElement(children, {
          className: clsx(
            'w-full',
            error ? 'border-neutral-500/60 focus:border-neutral-400/70 focus:ring-neutral-400/30' : '',
            children.props.className
          )
        })
      : children

  const headingId = useMemo(() => `field-${Math.random().toString(36).slice(2, 9)}`, [])

  return (
    <div role="group" aria-labelledby={headingId} className="flex flex-col gap-3" data-field={id}>
      <div className="flex items-baseline justify-between gap-4">
        <span id={headingId} className="text-[11px] font-semibold uppercase tracking-[0.26em] text-white/70">
          {label}
          {required ? <span className="text-white/50"> *</span> : null}
        </span>
        {hint ? (
          <span className="text-xs text-white/50">{hint}</span>
        ) : (
          <span aria-hidden="true" className="select-none text-xs text-transparent">placeholder</span>
        )}
      </div>
      {control}
      {error ? <span className="text-xs text-neutral-300">{error}</span> : null}
    </div>
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

function Progress({ steps, current, onNavigate }) {
  return (
    <nav className="flex flex-wrap items-center justify-center gap-3 text-xs text-white/60">
      {steps.map((step, index) => {
        const isActive = index === current
        return (
          <button
            key={step.key}
            type="button"
            onClick={() => onNavigate(index)}
            className={clsx(
              'flex min-w-[140px] flex-col items-center rounded-2xl border px-4 py-2 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60',
              isActive
                ? 'border-white bg-white text-neutral-900'
                : 'border-white/40 bg-transparent text-white/70 hover:bg-white/10 hover:text-white'
            )}
            aria-current={isActive ? 'step' : undefined}
          >
            <span className={clsx('font-semibold uppercase tracking-[0.26em] transition-colors', isActive ? 'text-neutral-900' : 'text-white/70')}>
              Step {index + 1}
            </span>
            <span className={clsx('mt-1 text-[11px] tracking-wide transition-colors', isActive ? 'text-neutral-700' : 'text-white/50')}>
              {step.title}
            </span>
          </button>
        )
      })}
    </nav>
  )
}

function CheckboxGrid({ options, value, onChange, onComplete }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {options.map((option) => {
        const checked = value.includes(option)
        return (
          <button
            type="button"
            key={option}
            onClick={() => {
              const next = toggleValue(value, option)
              onChange(next)
              // auto-advance after picking at least one (and not choosing Other which may open a follow-up)
              if (next.length && option !== 'Other' && onComplete) onComplete()
            }}
            className={clsx(
              'flex items-start justify-start rounded-2xl border px-4 py-3 text-left text-sm transition shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70',
              checked ? 'border-white bg-white text-neutral-900' : 'border-white/40 bg-transparent text-white/80 hover:bg-white/10 hover:text-white'
            )}
            aria-pressed={checked}
          >
            {option}
          </button>
        )
      })}
    </div>
  )
}

function RadioGrid({ options, value, onChange, onComplete }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {options.map((option) => {
        const checked = value === option
        return (
          <button
            type="button"
            key={option}
            onClick={() => {
              onChange(option)
              if (option !== 'Other' && onComplete) onComplete()
            }}
            className={clsx(
              'flex items-start justify-start rounded-2xl border px-4 py-3 text-left text-sm transition shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70',
              checked ? 'border-white bg-white text-neutral-900' : 'border-white/40 bg-transparent text-white/80 hover:bg-white/10 hover:text-white'
            )}
            aria-pressed={checked}
          >
            {option}
          </button>
        )
      })}
    </div>
  )
}

function FileUploadField({ id, label, hint, value, onChange, multiple = true, accept }) {
  async function handleSelection(event) {
    const files = event.target.files
    if (!files || !files.length) return
    try {
      const results = await readFiles(files)
      onChange(multiple ? [...value, ...results] : results.slice(0, 1))
    } catch (err) {
      console.warn('Failed to read files', err)
    } finally {
      event.target.value = ''
    }
  }

  function removeFile(index) {
    onChange(value.filter((_, idx) => idx !== index))
  }

  return (
    <div className="flex flex-col gap-3" role="group" aria-label={label} data-field={id}>
      <div className="flex items-baseline justify-between gap-4">
        <span className="text-[11px] font-semibold uppercase tracking-[0.26em] text-white/70">{label}</span>
        {hint ? <span className="text-xs text-white/50">{hint}</span> : null}
      </div>
      <div className="flex flex-col gap-3 rounded-2xl border border-dashed border-white/20 bg-white/5 p-5">
        <input
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleSelection}
          className="text-sm text-white/80 file:mr-3 file:rounded-full file:border file:border-white/20 file:bg-white/10 file:px-4 file:py-2 file:text-xs file:uppercase file:tracking-[0.22em] file:text-white/70 hover:file:bg-white/20"
        />
        {value.length ? (
          <ul className="space-y-2 text-xs text-white/70">
            {value.map((file, index) => (
              <li key={`${file.name}-${index}`} className="flex items-center justify-between gap-3">
                <span className="truncate">{file.name}</span>
                <button type="button" onClick={() => removeFile(index)} className="text-neutral-300 hover:text-neutral-200">
                  Remove
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-white/50">No files added yet.</p>
        )}
      </div>
    </div>
  )
}

// --- Sections with auto-advance hooks ---
function ObjectivesSection({ form, setForm, errors, step, goToStep, onAdvance, sectionsLen }) {
  const adv = (fieldId) => onAdvance(fieldId, step, goToStep, sectionsLen)

  return (
    <FormBlock
      title="Campaign objectives"
      description="Clarify what success looks like so the strategy team can respond with precision."
    >
      <Field id="objectives" label="What is the objective of this campaign?" required error={errors.objectives}>
        <CheckboxGrid
          options={objectiveOptions}
          value={form.objectives}
          onChange={(next) => setForm((prev) => ({ ...prev, objectives: next }))}
          onComplete={() => adv('objectives')}
        />
      </Field>

      {form.objectives.includes('Other') ? (
        <Field id="objectiveOther" label="Objective — Other" hint="Describe the additional outcome we should prioritize" required error={errors.objectiveOther}>
          <textarea
            rows={3}
            value={form.objectiveOther}
            onChange={(e) => setForm((p) => ({ ...p, objectiveOther: e.target.value }))}
            onBlur={() => form.objectiveOther.trim() && adv('objectiveOther')}
            placeholder="Expand on the unique objective driving this campaign."
            className="min-h-[120px]"
          />
        </Field>
      ) : null}

      <Field id="campaignType" label="What type of campaign is this?" required error={errors.campaignType}>
        <RadioGrid
          options={campaignTypeOptions}
          value={form.campaignType}
          onChange={(next) => setForm((prev) => ({ ...prev, campaignType: next, campaignTypeOther: next === 'Other' ? prev.campaignTypeOther : '' }))}
          onComplete={() => adv('campaignType')}
        />
      </Field>

      {form.campaignType === 'Other' ? (
        <Field id="campaignTypeOther" label="Campaign type — Other" required error={errors.campaignTypeOther}>
          <input
            value={form.campaignTypeOther}
            onChange={(e) => setForm((p) => ({ ...p, campaignTypeOther: e.target.value }))}
            onKeyDown={(e) => e.key === 'Enter' && form.campaignTypeOther.trim() && adv('campaignTypeOther')}
            onBlur={() => form.campaignTypeOther.trim() && adv('campaignTypeOther')}
            placeholder="Describe the campaign format."
          />
        </Field>
      ) : null}

      <Field id="ctaFocus" label="What should the CTA lean more towards?" required error={errors.ctaFocus}>
        <RadioGrid
          options={ctaOptions}
          value={form.ctaFocus}
          onChange={(next) => setForm((prev) => ({ ...prev, ctaFocus: next, ctaOther: next === 'Other' ? prev.ctaOther : '' }))}
          onComplete={() => adv('ctaFocus')}
        />
      </Field>

      {form.ctaFocus === 'Other' ? (
        <Field id="ctaOther" label="CTA focus — Other" required error={errors.ctaOther}>
          <input
            value={form.ctaOther}
            onChange={(e) => setForm((p) => ({ ...p, ctaOther: e.target.value }))}
            onKeyDown={(e) => e.key === 'Enter' && form.ctaOther.trim() && adv('ctaOther')}
            onBlur={() => form.ctaOther.trim() && adv('ctaOther')}
            placeholder="Describe the CTA focus in your words."
          />
        </Field>
      ) : null}
    </FormBlock>
  )
}

function AudienceSection({ form, setForm, errors, step, goToStep, onAdvance, sectionsLen }) {
  const adv = (fieldId) => onAdvance(fieldId, step, goToStep, sectionsLen)

  return (
    <FormBlock
      title="Audience & messaging"
      description="Explain who we are speaking to and what transformation they should experience."
    >
      <Field id="demographics" label="Who are we targeting? (demographics)" required error={errors.demographics} hint="Age, location, role, income band, etc.">
        <textarea
          rows={4}
          value={form.demographics}
          onChange={(e) => setForm((p) => ({ ...p, demographics: e.target.value }))}
          onBlur={() => form.demographics.trim() && adv('demographics')}
          placeholder="Outline the primary demographic profile in as much detail as possible."
          className="min-h-[140px]"
        />
      </Field>

      <Field id="psychographics" label="What psychographics matter most?" required error={errors.psychographics} hint="Values, behaviours, affinities, and motivations">
        <textarea
          rows={4}
          value={form.psychographics}
          onChange={(e) => setForm((p) => ({ ...p, psychographics: e.target.value }))}
          onBlur={() => form.psychographics.trim() && adv('psychographics')}
          placeholder="Describe beliefs, interests, and lifestyle cues that define this audience."
          className="min-h-[140px]"
        />
      </Field>

      <Field id="problemsSolved" label="What problems or needs does your product/service solve for them?" required error={errors.problemsSolved}>
        <textarea
          rows={4}
          value={form.problemsSolved}
          onChange={(e) => setForm((p) => ({ ...p, problemsSolved: e.target.value }))}
          onBlur={() => form.problemsSolved.trim() && adv('problemsSolved')}
          placeholder="Explain the core jobs-to-be-done and outcomes your offer delivers."
          className="min-h-[140px]"
        />
      </Field>

      <Field id="painPoints" label="What pain points, desires, or motivations should we address?" required error={errors.painPoints}>
        <textarea
          rows={4}
          value={form.painPoints}
          onChange={(e) => setForm((p) => ({ ...p, painPoints: e.target.value }))}
          onBlur={() => form.painPoints.trim() && adv('painPoints')}
          placeholder="List the barriers, objections, and sparks we should lean into."
          className="min-h-[140px]"
        />
      </Field>

      <Field id="audienceTarget" label="Are we targeting existing customers, new prospects, or both?" required error={errors.audienceTarget}>
        <RadioGrid
          options={audienceOptions}
          value={form.audienceTarget}
          onChange={(next) => setForm((prev) => ({ ...prev, audienceTarget: next }))}
          onComplete={() => adv('audienceTarget')}
        />
      </Field>

      <FileUploadField
        id="personasFiles"
        label="Do you have buyer personas, audience segments, or market research we should reference?"
        hint="Upload PDFs, decks, or docs (optional)"
        value={form.personasFiles}
        onChange={(next) => setForm((prev) => ({ ...prev, personasFiles: next }))}
        multiple={false}
      />

      <Field id="audienceThinkFeel" label="What do you want the audience think/feel after interacting with this work?" required error={errors.audienceThinkFeel}>
        <textarea
          rows={4}
          value={form.audienceThinkFeel}
          onChange={(e) => setForm((p) => ({ ...p, audienceThinkFeel: e.target.value }))}
          onBlur={() => form.audienceThinkFeel.trim() && adv('audienceThinkFeel')}
          placeholder="Describe the primary emotional or cognitive shift you expect."
          className="min-h-[140px]"
        />
      </Field>

      <Field
        id="audienceThinkFeelSecondary"
        label="What do you want the audience think/feel after interacting with this work? (Part 2)"
        required
        error={errors.audienceThinkFeelSecondary}
        hint="Use this to expand on behaviour changes or reinforcing feelings"
      >
        <textarea
          rows={4}
          value={form.audienceThinkFeelSecondary}
          onChange={(e) => setForm((p) => ({ ...p, audienceThinkFeelSecondary: e.target.value }))}
          onBlur={() => form.audienceThinkFeelSecondary.trim() && adv('audienceThinkFeelSecondary')}
          placeholder="Add nuance or secondary reactions you want to guarantee."
          className="min-h-[140px]"
        />
      </Field>
    </FormBlock>
  )
}

function DeliverablesSection({ form, setForm, errors, step, goToStep, onAdvance, sectionsLen }) {
  const adv = (fieldId) => onAdvance(fieldId, step, goToStep, sectionsLen)

  return (
    <FormBlock
      title="Deliverables & logistics"
      description="Capture the production scope, mandatory elements, and success metrics."
    >
      <Field id="deliverables" label="What formats/deliverables do you need?" required error={errors.deliverables}>
        <CheckboxGrid
          options={deliverableOptions}
          value={form.deliverables}
          onChange={(next) => setForm((prev) => ({ ...prev, deliverables: next }))}
          onComplete={() => adv('deliverables')}
        />
      </Field>

      {form.deliverables.includes('Other') ? (
        <Field id="deliverablesOther" label="Deliverables — Other" required error={errors.deliverablesOther}>
          <textarea
            rows={3}
            value={form.deliverablesOther}
            onChange={(e) => setForm((p) => ({ ...p, deliverablesOther: e.target.value }))}
            onBlur={() => form.deliverablesOther.trim() && adv('deliverablesOther')}
            placeholder="Outline additional deliverables, specs, or formats."
            className="min-h-[120px]"
          />
        </Field>
      ) : null}

      <Field id="brandTone" label="How would you like your brand to come across in this campaign?" required error={errors.brandTone}>
        <CheckboxGrid
          options={brandToneOptions}
          value={form.brandTone}
          onChange={(next) => setForm((prev) => ({ ...prev, brandTone: next }))}
          onComplete={() => adv('brandTone')}
        />
      </Field>

      {form.brandTone.includes('Other') ? (
        <Field id="brandToneOther" label="Brand tone — Other" required error={errors.brandToneOther}>
          <textarea
            rows={3}
            value={form.brandToneOther}
            onChange={(e) => setForm((p) => ({ ...p, brandToneOther: e.target.value }))}
            onBlur={() => form.brandToneOther.trim() && adv('brandToneOther')}
            placeholder="Describe the unique tone or mood we should convey."
            className="min-h-[120px]"
          />
        </Field>
      ) : null}

      <FileUploadField
        id="referenceCampaigns"
        label="Do you have reference campaigns, brands, or moodboards we should take inspiration from?"
        hint="Upload up to 5 files (optional)"
        value={form.referenceCampaigns}
        onChange={(next) => setForm((prev) => ({ ...prev, referenceCampaigns: next }))}
      />

      <FileUploadField
        id="mandatoryAssets"
        label="Please upload any mandatory elements that must appear in this campaign"
        hint="Logos, taglines, disclaimers, etc. (optional)"
        value={form.mandatoryAssets}
        onChange={(next) => setForm((prev) => ({ ...prev, mandatoryAssets: next }))}
      />

      <FileUploadField
        id="brandGuidelines"
        label="Please upload any brand guidelines (logos, fonts, colours, etc.) we should follow"
        hint="Optional — attach if handy"
        value={form.brandGuidelines}
        onChange={(next) => setForm((prev) => ({ ...prev, brandGuidelines: next }))}
      />

      <FileUploadField
        id="packShots"
        label="Please upload any pack shots/product images we should use"
        hint="Optional — attach if handy"
        value={form.packShots}
        onChange={(next) => setForm((prev) => ({ ...prev, packShots: next }))}
      />

      <Field id="budget" label="What is the Budget?" required error={errors.budget}>
        <input
          value={form.budget}
          onChange={(e) => setForm((p) => ({ ...p, budget: e.target.value }))}
          onKeyDown={(e) => e.key === 'Enter' && form.budget.trim() && adv('budget')}
          onBlur={() => form.budget.trim() && adv('budget')}
          placeholder="Share the working budget or range."
        />
      </Field>

      <Field id="goLiveDate" label="What is the Go-live date?" required error={errors.goLiveDate}>
        <input
          type="date"
          value={form.goLiveDate}
          onChange={(e) => setForm((p) => ({ ...p, goLiveDate: e.target.value }))}
          onBlur={() => form.goLiveDate && adv('goLiveDate')}
        />
      </Field>

      <Field id="successMetrics" label="How would you measure the success of this campaign" required error={errors.successMetrics}>
        <CheckboxGrid
          options={successMetricOptions}
          value={form.successMetrics}
          onChange={(next) => setForm((prev) => ({ ...prev, successMetrics: next }))}
          onComplete={() => adv('successMetrics')}
        />
      </Field>

      {form.successMetrics.includes('Other') ? (
        <Field id="successMetricsOther" label="Success metrics — Other" required error={errors.successMetricsOther}>
          <textarea
            rows={3}
            value={form.successMetricsOther}
            onChange={(e) => setForm((p) => ({ ...p, successMetricsOther: e.target.value }))}
            onBlur={() => form.successMetricsOther.trim() && adv('successMetricsOther')}
            placeholder="Specify the metric or measurement framework."
            className="min-h-[120px]"
          />
        </Field>
      ) : null}

      <Field id="generalNotes" label="General Notes (anything else we should know)" required error={errors.generalNotes}>
        <textarea
          rows={4}
          value={form.generalNotes}
          onChange={(e) => setForm((p) => ({ ...p, generalNotes: e.target.value }))}
          onBlur={() => form.generalNotes.trim() && adv('generalNotes')}
          placeholder="Flag approvals, redlines, timelines, or additional context your team wants us to note."
          className="min-h-[140px]"
        />
      </Field>
    </FormBlock>
  )
}
