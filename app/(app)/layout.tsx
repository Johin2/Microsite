import { ReactNode } from 'react'
import Link from 'next/link'

const navItems = [
  { href: '/(app)/dashboard', label: 'Dashboard' },
  { href: '/(app)/projects', label: 'Projects' },
  { href: '/(app)/new', label: 'New Project' }
]

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/40 px-6 py-4">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-primary">Control Tower</p>
          <h1 className="text-xl font-semibold text-white">Project Ops Hub</h1>
        </div>
        <nav className="flex items-center gap-4 text-sm">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="text-slate-300 hover:text-white">
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <main>{children}</main>
    </div>
  )
}
