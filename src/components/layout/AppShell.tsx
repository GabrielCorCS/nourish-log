import { type ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import { BottomNav } from './BottomNav'
import { Header } from './Header'

interface AppShellProps {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-cream">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Mobile Header */}
      <Header />

      {/* Main Content */}
      <main className="lg:ml-64 px-4 lg:px-8 py-4 lg:py-8">
        {children}
      </main>

      {/* Mobile Bottom Nav */}
      <BottomNav />
    </div>
  )
}
