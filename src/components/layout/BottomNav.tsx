import { NavLink } from 'react-router-dom'
import { Home, BookOpen, ChefHat, Apple, TrendingUp, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUIStore } from '@/stores'

// Logging lives dead-center; primary destinations flank it. Pantry is included
// here so ingredients are reachable on mobile — the desktop sidebar always had
// it, but the mobile bar previously omitted it, leaving no way in.
const leftItems = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/journal', label: 'Journal', icon: BookOpen },
]
const rightItems = [
  { path: '/recipes', label: 'Recipes', icon: ChefHat },
  { path: '/pantry', label: 'Pantry', icon: Apple },
  { path: '/progress', label: 'Progress', icon: TrendingUp },
]

function NavItem({ item }: { item: (typeof leftItems)[number] }) {
  return (
    <NavLink
      to={item.path}
      className={({ isActive }) =>
        cn(
          'pressable flex h-11 min-w-0 items-center justify-center gap-1.5 rounded-full',
          'transition-all duration-300 ease-spring',
          isActive ? 'bg-emerald/12 px-3 text-emerald-dark' : 'px-2.5 text-espresso/45 hover:text-espresso'
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
              isActive ? 'max-w-[72px] opacity-100' : 'max-w-0 opacity-0'
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
      <div className="flex items-center px-2 pt-2 pb-[max(env(safe-area-inset-bottom),0.5rem)]">
        {/* Flex-1 side groups keep the Log button centered even with uneven counts */}
        <div className="flex flex-1 items-center justify-around gap-0.5">
          {leftItems.map((item) => (
            <NavItem key={item.path} item={item} />
          ))}
        </div>

        {/* Center: the always-present Log action */}
        <button
          type="button"
          onClick={openLogMealModal}
          aria-label="Log food"
          className="pressable -mt-7 mx-1 flex h-16 w-16 shrink-0 flex-col items-center justify-center gap-0.5 rounded-full bg-gradient-to-b from-emerald to-emerald-dark text-white shadow-glow ring-4 ring-cream"
        >
          <Plus className="h-6 w-6" />
          <span className="text-[10px] font-bold uppercase tracking-wide">Log</span>
        </button>

        <div className="flex flex-1 items-center justify-around gap-0.5">
          {rightItems.map((item) => (
            <NavItem key={item.path} item={item} />
          ))}
        </div>
      </div>
    </nav>
  )
}
