import { NavLink } from 'react-router-dom'
import { Home, BookOpen, ChefHat, TrendingUp, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUIStore } from '@/stores'

// Logging lives dead-center; the rest of the app flanks it two-per-side.
const leftItems = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/journal', label: 'Journal', icon: BookOpen },
]
const rightItems = [
  { path: '/recipes', label: 'Recipes', icon: ChefHat },
  { path: '/progress', label: 'Progress', icon: TrendingUp },
]

function NavItem({ item }: { item: (typeof leftItems)[number] }) {
  return (
    <NavLink
      to={item.path}
      className={({ isActive }) =>
        cn(
          'pressable flex h-11 items-center justify-center gap-2 rounded-full',
          'transition-all duration-300 ease-spring',
          isActive ? 'bg-emerald/12 px-4 text-emerald-dark' : 'px-3 text-espresso/45 hover:text-espresso'
        )
      }
    >
      {({ isActive }) => (
        <>
          <item.icon
            className={cn(
              'h-5 w-5 shrink-0 transition-transform duration-300 ease-bounce-soft',
              isActive && 'scale-110'
            )}
          />
          <span
            className={cn(
              'overflow-hidden whitespace-nowrap text-xs font-semibold transition-all duration-300 ease-spring',
              isActive ? 'max-w-[84px] opacity-100' : 'max-w-0 opacity-0'
            )}
          >
            {item.label}
          </span>
        </>
      )}
    </NavLink>
  )
}

export function BottomNav() {
  const openLogMealModal = useUIStore((s) => s.openLogMealModal)

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-latte/70 bg-warm-white/85 backdrop-blur-lg shadow-[0_-4px_24px_rgba(16,80,40,0.06)]">
      <div className="flex items-center justify-around gap-1 px-2 pt-2 pb-[max(env(safe-area-inset-bottom),0.5rem)]">
        {leftItems.map((item) => (
          <NavItem key={item.path} item={item} />
        ))}

        {/* Center: the always-present Log action */}
        <button
          type="button"
          onClick={openLogMealModal}
          aria-label="Log food"
          className="pressable -mt-7 flex h-16 w-16 shrink-0 flex-col items-center justify-center gap-0.5 rounded-full bg-gradient-to-b from-emerald to-emerald-dark text-white shadow-glow ring-4 ring-cream"
        >
          <Plus className="h-6 w-6" />
          <span className="text-[10px] font-bold uppercase tracking-wide">Log</span>
        </button>

        {rightItems.map((item) => (
          <NavItem key={item.path} item={item} />
        ))}
      </div>
    </nav>
  )
}
