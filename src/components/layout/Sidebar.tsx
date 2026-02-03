import { NavLink } from 'react-router-dom'
import {
  Home,
  BookOpen,
  ChefHat,
  Apple,
  TrendingUp,
  Settings,
  UserPlus,
  Package,
  ShoppingCart,
  LogOut,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui'

const navItems = [
  { path: '/', label: 'Dashboard', icon: Home },
  { path: '/journal', label: 'Journal', icon: BookOpen },
  { path: '/recipes', label: 'Recipes', icon: ChefHat },
  { path: '/pantry', label: 'Pantry', icon: Apple },
  { path: '/inventory', label: 'Inventory', icon: Package },
  { path: '/shopping', label: 'Shopping', icon: ShoppingCart },
  { path: '/progress', label: 'Progress', icon: TrendingUp },
]

export function Sidebar() {
  const { profile, isAdmin, signOut } = useAuth()

  return (
    <aside className="hidden lg:flex flex-col w-64 h-screen bg-warm-white border-r border-latte fixed left-0 top-0">
      {/* Logo */}
      <div className="p-6 border-b border-latte">
        <h1 className="font-heading text-2xl font-bold text-espresso">
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
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 overflow-y-auto">
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

      {/* Bottom section */}
      <div className="p-4 border-t border-latte space-y-1">
        {isAdmin && (
          <NavLink
            to="/invitations"
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
            <UserPlus className="h-5 w-5" />
            Invitations
          </NavLink>
        )}
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
        <Button
          variant="ghost"
          onClick={signOut}
          className="w-full justify-start gap-3 px-4 py-3 text-espresso/70 hover:bg-latte/30 hover:text-espresso"
        >
          <LogOut className="h-5 w-5" />
          Sign Out
        </Button>
      </div>
    </aside>
  )
}
