import type { Metadata } from 'next'
import { ReactNode } from 'react'
import './globals.css'

export const metadata: Metadata = {
  title: 'Project Ops Microsite',
  description: 'Agentic intake, planning, tracking, and automatic repair for software projects.'
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-950 text-slate-100">
        <div className="mx-auto max-w-7xl px-6 pb-16 pt-10">
          {children}
        </div>
      </body>
    </html>
  )
}
