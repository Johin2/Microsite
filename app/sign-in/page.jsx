import { SignInForm } from '@components/SignInForm'

export const dynamic = 'force-dynamic'

export default function SignInPage() {
  return (
    <div className="space-y-8">
      <header className="text-center">
        <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-white/70">
          Glassbox team access
        </span>
      </header>
      <SignInForm />
    </div>
  )
}

