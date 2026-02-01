import { NavLink } from 'react-router-dom'
import {
  Home,
  BookOpen,
  ChefHat,
  Apple,
  TrendingUp,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/journal', label: 'Journal', icon: BookOpen },
  { path: '/recipes', label: 'Recipes', icon: ChefHat },
  { path: '/pantry', label: 'Pantry', icon: Apple },
  { path: '/progress', label: 'Progress', icon: TrendingUp },
]

export function BottomNav() {
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-warm-white border-t border-latte z-40">
      <div className="flex items-center justify-around h-16 px-2 safe-area-bottom">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center justify-center gap-0.5',
                'w-16 h-12 rounded-button transition-all duration-200',
                isActive
                  ? 'text-caramel'
                  : 'text-espresso/50 hover:text-espresso'
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon className={cn('h-5 w-5', isActive && 'scale-110')} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
