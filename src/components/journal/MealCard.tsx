import { Edit2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui'
import { MacroPills } from '@/components/shared'
import { formatTime } from '@/lib/dates'
import { useHousehold } from '@/hooks/useHousehold'
import type { FoodEntryWithDetails } from '@/types/database'

interface MealCardProps {
  entry: FoodEntryWithDetails
  onEdit?: (entry: FoodEntryWithDetails) => void
  onDelete?: (entry: FoodEntryWithDetails) => void
}

export function MealCard({ entry, onEdit, onDelete }: MealCardProps) {
  const { data: household } = useHousehold()
  const name = entry.recipe?.name || 'Quick add'
  const emoji = entry.recipe?.emoji || '🍽️'
  const loggedByOther = entry.logged_by != null && entry.logged_by !== entry.user_id
  const loggerName = loggedByOther
    ? household?.members.find((m) => m.id === entry.logged_by)?.name ?? 'partner'
    : null

  return (
    <div className="pressable rounded-[22px] bg-warm-white p-4 ring-1 ring-latte/60 transition-shadow hover:shadow-soft">
      <div className="flex items-center gap-3">
        {/* Emoji avatar */}
        <span className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-[18px] bg-gradient-to-br from-emerald/[0.12] to-emerald/[0.04] text-xl ring-1 ring-emerald/15">
          {emoji}
        </span>

        {/* Name + meta */}
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-[15px] font-semibold leading-snug text-espresso">
            {name}
          </p>
          <p className="metric mt-0.5 text-xs text-espresso/45">
            {formatTime(entry.logged_at)}
            {entry.servings !== 1 && ` · ${entry.servings} srv`}
            {loggerName && ` · by ${loggerName}`}
          </p>
        </div>

        {/* Right side: calorie figure + actions */}
        <div className="flex shrink-0 items-center gap-2">
          <div className="text-right">
            <span className="metric text-xl font-bold leading-none text-espresso">
              {Math.round(entry.calories)}
            </span>
            <span className="block text-[10px] font-bold uppercase tracking-wide text-espresso/40">
              kcal
            </span>
          </div>
          {(onEdit || onDelete) && (
            <div className="flex items-center gap-0.5">
              {onEdit && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-espresso/40 hover:text-espresso"
                  onClick={() => onEdit(entry)}
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-espresso/40 hover:bg-terracotta/10 hover:text-terracotta"
                  onClick={() => onDelete(entry)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Macro pills row */}
      <MacroPills
        calories={entry.calories}
        protein={entry.protein}
        carbs={entry.carbs}
        fat={entry.fat}
        className="mt-3"
        hideCalories
      />

      {/* Optional notes */}
      {entry.notes && (
        <p className="mt-2 text-xs italic text-espresso/45">
          &ldquo;{entry.notes}&rdquo;
        </p>
      )}
    </div>
  )
}
