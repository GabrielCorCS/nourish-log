import { NavLink } from 'react-router-dom'
import {
  Home,
  BookOpen,
  CalendarClock,
  ChefHat,
  Apple,
  TrendingUp,
  Sparkles,
  Settings,
  Package,
  ShoppingCart,
  LogOut,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import { useHousehold } from '@/hooks/useHousehold'
import { Button } from '@/components/ui'

const coreNav = [
  { path: '/', label: 'Dashboard', icon: Home },
  { path: '/journal', label: 'Journal', icon: BookOpen },
  { path: '/schedule', label: 'Schedule', icon: CalendarClock },
  { path: '/recipes', label: 'Recipes', icon: ChefHat },
  { path: '/inspo', label: 'Inspo', icon: Sparkles },
  { path: '/progress', label: 'Progress', icon: TrendingUp },
]

const groceryNav = [
  { path: '/pantry', label: 'Pantry', icon: Apple },
  { path: '/inventory', label: 'Inventory', icon: Package },
  { path: '/shopping', label: 'Shopping', icon: ShoppingCart },
]

export function Sidebar() {
  const { profile, signOut } = useAuth()
  const { data: household } = useHousehold()
  const partner = household?.partner ?? null

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      'pressable group flex items-center gap-3 px-4 py-3 rounded-button',
      'text-sm font-medium transition-all duration-200 ease-spring',
      isActive
        ? 'bg-gradient-to-r from-emerald/15 to-emerald/5 text-emerald-dark font-semibold ring-1 ring-emerald/15 shadow-soft'
        : 'text-espresso/70 hover:bg-sage/10 hover:text-espresso'
    )

  return (
    <aside className="hidden lg:flex flex-col w-64 h-screen bg-warm-white border-r border-latte fixed left-0 top-0">
      {/* Logo */}
      <div className="flex items-center gap-3 p-6 border-b border-latte">
        <span className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-b from-emerald to-emerald-dark text-xl shadow-soft">
          🥗
        </span>
        <h1 className="font-heading text-2xl font-extrabold tracking-tight text-espresso">
          NourishLog
        </h1>
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-latte">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-latte flex items-center justify-center text-xl">
            {profile?.avatar_emoji || '👤'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-espresso truncate">
              {profile?.name || 'User'}
            </p>
            <p className="text-xs text-espresso/60 truncate">
              {profile?.email}
            </p>
          </div>
        </div>
        {partner && (
          <p className="mt-2 text-xs text-espresso/40 truncate">
            shared with {partner.avatar_emoji || '👤'} {partner.name}
          </p>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <ul className="space-y-1">
          {coreNav.map((item) => (
            <li key={item.path}>
              <NavLink to={item.path} className={linkClass}>
                <item.icon className="h-5 w-5" />
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="mt-6 mb-2 px-4 text-xs font-medium uppercase tracking-wide text-espresso/40">
          Groceries
        </div>
        <ul className="space-y-1">
          {groceryNav.map((item) => (
            <li key={item.path}>
              <NavLink to={item.path} className={linkClass}>
                <item.icon className="h-5 w-5" />
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Bottom section */}
      <div className="p-4 border-t border-latte space-y-1">
        <NavLink to="/settings" className={linkClass}>
          <Settings className="h-5 w-5" />
          Settings
        </NavLink>
        <Button
          variant="ghost"
          onClick={signOut}
          className="w-full justify-start gap-3 px-4 py-3 text-espresso/70 hover:bg-sage/10 hover:text-espresso"
        >
          <LogOut className="h-5 w-5" />
          Sign Out
        </Button>
      </div>
    </aside>
  )
}
