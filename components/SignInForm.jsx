'use client'

import { useMemo, useState } from 'react'
import { createBrowserSupabaseClient } from '@lib/supabase-browser'
import { isAllowedEmail } from '@lib/auth-utils'

const TEAM_AUDIENCES = new Set(['team', 'admin', 'internal'])

export function SignInForm({ audience = 'client' }) {
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [phase, setPhase] = useState('enter-email') // enter-email | enter-code | done
  const [error, setError] = useState(null)
  const [message, setMessage] = useState(null)
  const [loading, setLoading] = useState(false)
  const normalizedAudience = useMemo(() => (audience || '').toLowerCase(), [audience])
  const isTeamSignIn = TEAM_AUDIENCES.has(normalizedAudience)
  const requiresAllowlistedEmail = isTeamSignIn

  function nextPath() {
    try {
      const url = new URL(window.location.href)
      return url.searchParams.get('next') || '/my'
    } catch {
      return '/my'
    }
  }

  async function sendCode(e) {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setLoading(true)
    try {
      const trimmedEmail = email.trim()
      if (!trimmedEmail) {
        throw new Error('Enter your work email to continue.')
      }

      const normalized = trimmedEmail.toLowerCase()

      if (requiresAllowlistedEmail && !isAllowedEmail(normalized)) {
        throw new Error('This email is not authorized for Glassbox team access.')
      }

      const supabase = createBrowserSupabaseClient()
      const { error } = await supabase.auth.signInWithOtp({
        email: trimmedEmail,
        options: {
          shouldCreateUser: true
        }
      })
      if (error) throw error
      setMessage('Check your email for a 6-digit code and enter it below.')
      setPhase('enter-code')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send code')
    } finally {
      setLoading(false)
    }
  }

  async function verifyCode(e) {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setLoading(true)
    try {
      const trimmedEmail = email.trim()
      if (!trimmedEmail) {
        throw new Error('Enter your work email to continue.')
      }

      const normalized = trimmedEmail.toLowerCase()

      if (requiresAllowlistedEmail && !isAllowedEmail(normalized)) {
        setPhase('enter-email')
        setCode('')
        throw new Error('This email is not authorized for Glassbox team access.')
      }

      const supabase = createBrowserSupabaseClient()
      const { data, error } = await supabase.auth.verifyOtp({
        email: trimmedEmail,
        token: code.trim(),
        type: 'email'
      })
      if (error) throw error
      const session = data?.session
      if (!session?.access_token || !session?.refresh_token || !session?.expires_at) {
        throw new Error('Unable to establish a session. Please request a new code and try again.')
      }
      const sync = await fetch('/api/auth/session', {
        method: 'POST',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          accessToken: session.access_token,
          refreshToken: session.refresh_token,
          expiresAt: session.expires_at
        })
      })
      if (!sync.ok) {
        throw new Error('Failed to persist sign-in. Please try again.')
      }
      // Determine role and destination
      const res = await fetch('/api/auth/whoami', { cache: 'no-store' })
      const who = await res.json().catch(() => ({ isTeam: false }))
      const target = resolveDestination(Boolean(who?.isTeam))
      setMessage('Signed in successfully. Redirecting…')
      setPhase('done')
      setTimeout(() => {
        window.location.assign(target)
      }, 400)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid code')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <header className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold text-white">
          {isTeamSignIn ? 'Team sign in' : 'Access your workspace'}
        </h1>
        <p className="text-sm text-white/70">
          {isTeamSignIn
            ? 'Use your Glassbox email to receive a one-time code.'
            : 'Enter the email you used when submitting your request to receive a one-time code.'}
        </p>
      </header>

      {phase === 'enter-email' ? (
        <form onSubmit={sendCode} className="space-y-4">
          <label className="flex flex-col gap-2">
            <span className="text-xs uppercase tracking-[0.24em] text-white/60">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={isTeamSignIn ? 'you@glassbox.studio' : 'you@example.com'}
            />
          </label>
          <button type="submit" disabled={loading} className="w-full justify-center">
            {loading ? 'Sending…' : 'Send code'}
          </button>
        </form>
      ) : null}

      {phase === 'enter-code' ? (
        <form onSubmit={verifyCode} className="space-y-4">
          <label className="flex flex-col gap-2">
            <span className="text-xs uppercase tracking-[0.24em] text-white/60">Verification code</span>
            <input
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              minLength={6}
              required
              value={code}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, '').slice(0, 6)
                setCode(digits)
              }}
              placeholder="6-digit code"
            />
          </label>
          <button type="submit" disabled={loading || code.trim().length !== 6} className="w-full justify-center">
            {loading ? 'Verifying…' : 'Verify & sign in'}
          </button>
          <button
            type="button"
            className="w-full justify-center bg-white/10 text-white"
            onClick={() => setPhase('enter-email')}
          >
            Use a different email
          </button>
        </form>
      ) : null}

      {error ? <p className="text-sm text-rose-400">{error}</p> : null}
      {message ? <p className="text-sm text-emerald-400/90">{message}</p> : null}
    </div>
  )
}

function resolveDestination(isTeam) {
  const fallback = isTeam ? '/dashboard' : '/my'

  try {
    const url = new URL(window.location.href)
    const next = url.searchParams.get('next')
    if (typeof next === 'string' && isAllowedNext(next, isTeam)) {
      return next
    }
  } catch {}

  return fallback
}

function isAllowedNext(next, isTeam) {
  if (!next || !next.startsWith('/') || next.startsWith('//')) {
    return false
  }

  if (isTeam) {
    return true
  }

  const teamOnlyPrefixes = ['/dashboard', '/projects', '/tasks', '/new']
  return !teamOnlyPrefixes.some((prefix) => next.startsWith(prefix))
}
