import { Edit2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui'
import { MacroPills } from '@/components/shared'
import { formatTime } from '@/lib/dates'
import { useHousehold } from '@/hooks/useHousehold'
import type { FoodEntryWithDetails, FoodEntryIngredient, Ingredient } from '@/types/database'

interface MealCardProps {
  entry: FoodEntryWithDetails
  onEdit?: (entry: FoodEntryWithDetails) => void
  onDelete?: (entry: FoodEntryWithDetails) => void
}

// Human-readable amount for one logged ingredient row (e.g. "150 g", "2 servings").
function formatAmount(row: FoodEntryIngredient): string {
  const amount = row.amount ?? row.quantity ?? 1
  const unit = row.unit ?? 'serving'
  if (unit === 'g' || unit === 'ml') return `${Math.round(amount)} ${unit}`
  const n = Math.round(amount * 100) / 100
  return `${n} ${n === 1 ? 'serving' : 'servings'}`
}

export function MealCard({ entry, onEdit, onDelete }: MealCardProps) {
  const { data: household } = useHousehold()
  const ingredients = (entry.food_entry_ingredients ?? []) as (FoodEntryIngredient & {
    ingredient: Ingredient | null
  })[]
  // Recipes carry their own name; ingredient-only entries are named after the
  // ingredients they're made of (falling back to "Quick add" only when truly empty).
  const ingredientNames = ingredients
    .map((i) => i.ingredient?.name)
    .filter(Boolean)
    .join(', ')
  const name = entry.recipe?.name || ingredientNames || 'Quick add'
  const emoji = entry.recipe?.emoji || ingredients[0]?.ingredient?.emoji || '🍽️'
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

      {/* Ingredients used (only for ingredient-based entries, not recipes) */}
      {!entry.recipe && ingredients.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {ingredients.map((ing) => (
            <span
              key={ing.id}
              className="inline-flex items-center gap-1 rounded-full bg-cream px-2.5 py-1 text-[11px] font-medium text-espresso/65 ring-1 ring-latte/50"
            >
              <span>{ing.ingredient?.emoji || '🥄'}</span>
              <span className="text-espresso/80">{ing.ingredient?.name ?? 'Ingredient'}</span>
              <span className="text-espresso/40">· {formatAmount(ing)}</span>
            </span>
          ))}
        </div>
      )}

      {/* Optional notes */}
      {entry.notes && (
        <p className="mt-2 text-xs italic text-espresso/45">
          &ldquo;{entry.notes}&rdquo;
        </p>
      )}
    </div>
  )
}
