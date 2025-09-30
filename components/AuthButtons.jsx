'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createBrowserSupabaseClient } from '@lib/supabase-browser'

function AuthButtons() {
  const [email, setEmail] = useState(null)
  const [isTeam, setIsTeam] = useState(false)
  // We keep redirects simple: role-based after sign-in

  useEffect(() => {
    const supabase = createBrowserSupabaseClient()

    async function refreshRole(hasEmail) {
      if (!hasEmail) {
        setIsTeam(false)
        return
      }
      try {
        const res = await fetch('/api/auth/whoami', { cache: 'no-store' })
        const data = await res.json()
        setIsTeam(Boolean(data?.isTeam))
      } catch {
        setIsTeam(false)
      }
    }

    supabase.auth.getUser().then(({ data }) => {
      const em = data?.user?.email ?? null
      setEmail(em)
      refreshRole(em)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const em = session?.user?.email ?? null
      setEmail(em)
      refreshRole(em)
    })
    return () => {
      sub?.subscription?.unsubscribe?.()
    }
  }, [])

  async function signOut() {
    const supabase = createBrowserSupabaseClient()
    await supabase.auth.signOut()
    await fetch('/api/auth/session', { method: 'DELETE' })
    window.location.assign('/')
  }

  return (
    <div className="flex items-center gap-2 text-xs">
      {email ? (
        <>
          <Link
            href={isTeam ? '/dashboard' : '/my'}
            className="rounded-full border border-white/15 bg-white/10 px-3 py-1 font-semibold text-white/80 hover:bg-white/20 hover:text-white"
          >
            {isTeam ? 'Open dashboard' : 'View workspace'}
          </Link>
          <button
            type="button"
            onClick={signOut}
            className="rounded-full border border-white/15 bg-white/90 px-3 py-1 font-semibold text-[#111216] hover:bg-white"
          >
            Sign out
          </button>
        </>
      ) : (
        <Link
          href="/sign-in?audience=client"
          className="rounded-full border border-white/15 bg-white/90 px-4 py-1 font-semibold text-[#111216] hover:bg-white"
        >
          Sign in
        </Link>
      )}
    </div>
  )
}

export default AuthButtons
