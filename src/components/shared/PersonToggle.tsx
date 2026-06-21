import { useHousehold } from '@/hooks/useHousehold'
import { useViewStore } from '@/stores'
import { cn } from '@/lib/utils'

/**
 * Big, clear toggle for whose data the app is showing. Writes to the global
 * view store, so flipping it here updates the dashboard, journal, and progress
 * everywhere at once.
 */
export function PersonToggle({ className }: { className?: string }) {
  const { data: household } = useHousehold()
  const members = household?.members ?? []
  const meId = household?.me?.id ?? null
  const { viewUserId, setViewUser } = useViewStore()

  if (members.length < 2) return null
  const active = viewUserId ?? meId

  return (
    <div
      className={cn(
        'grid grid-cols-2 gap-1.5 rounded-[20px] bg-warm-white p-1.5 ring-1 ring-latte/60',
        className
      )}
      role="tablist"
      aria-label="Whose data to show"
    >
      {members.map((m) => {
        const selected = active === m.id
        return (
          <button
            key={m.id}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => setViewUser(m.id === meId ? null : m.id)}
            className={cn(
              'pressable flex items-center justify-center gap-2 rounded-[15px] py-2.5 text-sm font-bold transition-colors',
              selected
                ? 'bg-gradient-to-b from-emerald to-emerald-dark text-white shadow-soft'
                : 'text-espresso/55 hover:bg-cream'
            )}
          >
            <span className="text-lg">{m.avatar_emoji || '👤'}</span>
            {m.name}
          </button>
        )
      })}
    </div>
  )
}
