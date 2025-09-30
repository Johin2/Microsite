import Link from 'next/link'

const navItems = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/projects', label: 'Projects' },
  { href: '/new', label: 'New Engagement' }
]

export default function AppLayout({ children }) {
  return (
    <div className="space-y-12">
      <header className="relative overflow-hidden rounded-[32px] border border-white/10 bg-white/[0.05] p-8 shadow-[0_32px_80px_rgba(0,0,0,0.55)] backdrop-blur-2xl">
        <div className="absolute top-[-40%] right-[-20%] h-64 w-64 rounded-full bg-white/10 blur-3xl" aria-hidden="true" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(245,245,245,0.14),_transparent_60%)]" aria-hidden="true" />
        <div className="relative flex flex-wrap items-center justify-between gap-8">
          <div className="space-y-3">
            <div className="flex flex-col gap-1 text-white/70">
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-primary/70">Studio concierge</p>
              <h1 className="text-3xl font-semibold text-white sm:text-4xl">Client engagement hub</h1>
              <p className="max-w-xl text-sm text-neutral-200/85">
                Review live initiatives, surface upcoming touchpoints, and keep every brand programme on a single runway.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-xs text-white/50">
              <div className="flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1">
                <span className="h-2 w-2 rounded-full bg-neutral-200" />
                <span>Internal workspace</span>
              </div>
              <Link href="/" className="underline">
                Open public intake
              </Link>
            </div>
          </div>
          <nav className="flex flex-wrap items-center gap-3 rounded-full border border-white/10 bg-white/10 px-2 py-2 text-sm shadow-[0_18px_40px_rgba(0,0,0,0.35)]">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="inline-flex items-center rounded-full px-4 py-2 font-medium text-white/80 transition hover:bg-white/20 hover:text-white"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="animate-fade-in-up space-y-10">{children}</main>
    </div>
  )
}
