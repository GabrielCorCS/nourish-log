import { Settings, LogOut } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui'
import { useAuth } from '@/contexts/AuthContext'

interface HeaderProps {
  title?: string
}

export function Header({ title }: HeaderProps) {
  const { profile, signOut } = useAuth()

  return (
    <header className="lg:hidden sticky top-0 z-30 bg-cream/80 backdrop-blur-lg border-b border-latte/70 pt-[env(safe-area-inset-top)]">
      <div className="flex items-center justify-between h-14 px-4">
        <div className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-b from-emerald to-emerald-dark text-base shadow-soft">
            🥗
          </span>
          <h1 className="font-heading text-xl font-extrabold tracking-tight text-espresso">
            {title || 'NourishLog'}
          </h1>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-8 w-8 rounded-full bg-sage/20 ring-1 ring-latte flex items-center justify-center text-lg">
            {profile?.avatar_emoji || '👤'}
          </div>
          <Link to="/settings">
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Settings className="h-5 w-5" />
            </Button>
          </Link>
          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={signOut}>
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  )
}
