import { INGREDIENT_CATEGORIES } from '@/lib/constants'
import { useFilterStore } from '@/stores'
import type { IngredientCategory } from '@/types/database'
import { cn } from '@/lib/utils'

export function CategoryTabs() {
  const { pantryCategory, setPantryCategory } = useFilterStore()

  const all = [
    { value: 'all' as const, label: 'All', emoji: '✨' },
    ...INGREDIENT_CATEGORIES.map((c) => ({ value: c.value as IngredientCategory, label: c.label, emoji: c.emoji })),
  ]

  return (
    <div className="no-scrollbar flex gap-2 overflow-x-auto pb-0.5">
      {all.map((cat) => {
        const active = pantryCategory === cat.value
        return (
          <button
            key={cat.value}
            type="button"
            onClick={() => setPantryCategory(cat.value)}
            className={cn(
              'pressable flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors',
              active
                ? 'bg-gradient-to-r from-emerald to-emerald-dark text-white shadow-soft'
                : 'bg-warm-white text-espresso/70 ring-1 ring-latte hover:bg-cream hover:text-espresso'
            )}
          >
            <span className="text-base leading-none">{cat.emoji}</span>
            <span>{cat.label}</span>
          </button>
        )
      })}
    </div>
  )
}
