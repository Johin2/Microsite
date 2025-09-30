import './globals.css'

import { Inter, Plus_Jakarta_Sans } from 'next/font/google'
import dynamic from 'next/dynamic'

export const metadata = {
  title: 'Project Ops Microsite',
  description: 'Agentic intake, planning, tracking, and automatic repair for software projects.'
}

const sans = Inter({ subsets: ['latin'], variable: '--font-sans' })
const display = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['600', '700', '800'], variable: '--font-display' })

// Dynamically import client component to avoid RSC client manifest mismatch
const AuthButtons = dynamic(() => import('../components/AuthButtons'), { ssr: false })

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${sans.variable} ${display.variable} relative min-h-screen overflow-x-hidden bg-neutral-950 text-neutral-100 antialiased`}>
        <div className="pointer-events-none fixed inset-0 -z-10 bg-aurora opacity-80 blur-3xl" aria-hidden="true" />
        <div className="absolute right-6 top-6 z-20">
          <AuthButtons />
        </div>
        <div className="pointer-events-none fixed inset-x-0 top-[-20%] -z-10 mx-auto h-[40rem] w-[40rem] rounded-full bg-gradient-to-br from-primary/30 via-primary/10 to-transparent blur-3xl opacity-60" aria-hidden="true" />
        <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 pb-16 pt-10 sm:px-10">
          <div className="animate-fade-in-up flex-1">{children}</div>
        </div>
      </body>
    </html>
  )
}
