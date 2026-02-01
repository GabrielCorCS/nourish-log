import { NavLink } from 'react-router-dom'
import {
  Home,
  BookOpen,
  ChefHat,
  Apple,
  TrendingUp,
  Settings,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { path: '/', label: 'Dashboard', icon: Home },
  { path: '/journal', label: 'Journal', icon: BookOpen },
  { path: '/recipes', label: 'Recipes', icon: ChefHat },
  { path: '/pantry', label: 'Pantry', icon: Apple },
  { path: '/progress', label: 'Progress', icon: TrendingUp },
]

export function Sidebar() {
  return (
    <aside className="hidden lg:flex flex-col w-64 h-screen bg-warm-white border-r border-latte fixed left-0 top-0">
      {/* Logo */}
      <div className="p-6 border-b border-latte">
        <h1 className="font-heading text-2xl font-bold text-espresso">
          🥗 NourishLog
        </h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-4 py-3 rounded-button',
                    'text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-caramel/10 text-caramel'
                      : 'text-espresso/70 hover:bg-latte/30 hover:text-espresso'
                  )
                }
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Settings */}
      <div className="p-4 border-t border-latte">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 px-4 py-3 rounded-button',
              'text-sm font-medium transition-all duration-200',
              isActive
                ? 'bg-caramel/10 text-caramel'
                : 'text-espresso/70 hover:bg-latte/30 hover:text-espresso'
            )
          }
        >
          <Settings className="h-5 w-5" />
          Settings
        </NavLink>
      </div>
    </aside>
  )
}
