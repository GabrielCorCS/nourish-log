import { Settings } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui'

interface HeaderProps {
  title?: string
}

export function Header({ title }: HeaderProps) {
  return (
    <header className="lg:hidden sticky top-0 z-30 bg-cream/95 backdrop-blur-sm border-b border-latte">
      <div className="flex items-center justify-between h-14 px-4">
        <h1 className="font-heading text-xl font-bold text-espresso">
          {title || '🥗 NourishLog'}
        </h1>
        <Link to="/settings">
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <Settings className="h-5 w-5" />
          </Button>
        </Link>
      </div>
    </header>
  )
}
