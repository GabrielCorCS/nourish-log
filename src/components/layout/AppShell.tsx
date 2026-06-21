import { type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { BottomNav } from './BottomNav'
import { Header } from './Header'

interface AppShellProps {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const location = useLocation()

  return (
    <div className="min-h-[100dvh] bg-cream">
      {/* Subtle ambient brand wash behind everything */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 opacity-60"
        style={{
          background:
            'radial-gradient(60% 50% at 100% 0%, rgba(132,204,22,0.10) 0%, rgba(132,204,22,0) 60%), radial-gradient(50% 40% at 0% 100%, rgba(22,163,74,0.08) 0%, rgba(22,163,74,0) 60%)',
        }}
      />

      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Mobile Header */}
      <Header />

      {/* Main Content — re-keyed per route to replay the enter animation */}
      <main className="lg:ml-64 px-4 lg:px-8 py-4 lg:py-8 pb-24 lg:pb-8">
        <div key={location.pathname} className="page-enter mx-auto w-full max-w-5xl">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <BottomNav />
    </div>
  )
}
