import { SignInForm } from '@components/SignInForm'

export const dynamic = 'force-dynamic'

function normalizeAudience(raw) {
  const value = typeof raw === 'string' ? raw.toLowerCase() : ''
  return value === 'team' || value === 'admin' || value === 'internal' ? 'team' : 'client'
}

export default function SignInPage({ searchParams }) {
  const audience = normalizeAudience(searchParams?.audience)
  const badgeText = audience === 'team' ? 'Glassbox team access' : 'Client workspace access'

  return (
    <div className="space-y-8">
      <header className="text-center">
        <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-white/70">
          {badgeText}
        </span>
      </header>
      <SignInForm audience={audience} />
    </div>
  )
}

