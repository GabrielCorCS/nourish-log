import { Plus, Minus, X } from 'lucide-react'
import { Button } from '@/components/ui'
import { IngredientSearch } from '@/components/ingredients/IngredientSearch'
import { cn } from '@/lib/utils'
import {
  scaleIngredient,
  supportsWeightEntry,
  servingGramsOf,
  servingsEquivalent,
  type AmountUnit,
} from '@/lib/nutrition'
import type { Ingredient } from '@/types/database'

export interface SelectedRecipeIngredient {
  ingredient: Ingredient
  amount: number
  unit: AmountUnit
}

interface IngredientPickerProps {
  selectedIngredients: SelectedRecipeIngredient[]
  onAdd: (ingredient: Ingredient, amount: number, unit: AmountUnit) => void
  onRemove: (ingredientId: string) => void
  onUpdate: (ingredientId: string, patch: { amount?: number; unit?: AmountUnit }) => void
}

function weightUnitFor(ingredient: Ingredient): AmountUnit {
  return ingredient.serving_unit === 'ml' ? 'ml' : 'g'
}

export function IngredientPicker({
  selectedIngredients,
  onAdd,
  onRemove,
  onUpdate,
}: IngredientPickerProps) {
  const handleSelect = (ingredient: Ingredient) => {
    if (selectedIngredients.find((si) => si.ingredient.id === ingredient.id)) {
      return
    }
    onAdd(ingredient, 1, 'serving')
  }

  return (
    <div className="space-y-4">
      {/* Search and Add */}
      <IngredientSearch
        onSelect={handleSelect}
        placeholder="Search ingredients to add…"
        excludeIds={selectedIngredients.map((si) => si.ingredient.id)}
      />

      {/* Selected Ingredients */}
      {selectedIngredients.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-wide text-espresso/55">
            Selected ({selectedIngredients.length})
          </p>
          {selectedIngredients.map(({ ingredient, amount, unit }) => {
            const nutrition = scaleIngredient(ingredient, amount, unit)
            const canWeigh = supportsWeightEntry(ingredient)
            const wUnit = weightUnitFor(ingredient)
            const step = unit === 'serving' ? 0.5 : 10

            const changeUnit = (next: AmountUnit) => {
              if (next === unit) return
              const servings = servingsEquivalent(ingredient, amount, unit) || 1
              const nextAmount =
                next === 'serving'
                  ? Math.round(servings * 100) / 100
                  : Math.max(1, Math.round(servings * servingGramsOf(ingredient)))
              onUpdate(ingredient.id, { unit: next, amount: nextAmount })
            }

            const setAmount = (n: number) =>
              onUpdate(ingredient.id, { amount: Math.max(step, Math.round(n * 100) / 100) })

            return (
              <div
                key={ingredient.id}
                className="space-y-2.5 rounded-[18px] bg-cream p-3.5 ring-1 ring-latte/40"
              >
                <div className="flex items-center gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-warm-white text-lg shadow-soft">
                    {ingredient.emoji || '🍽️'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-espresso truncate">
                      {ingredient.name}
                    </p>
                    <p className="metric text-xs text-espresso/50">
                      {Math.round(nutrition.calories)} cal · {Math.round(nutrition.protein)}p{' '}
                      {Math.round(nutrition.carbs)}c {Math.round(nutrition.fat)}f
                    </p>
                  </div>
                  <button
                    type="button"
                    className="pressable flex h-7 w-7 items-center justify-center rounded-full bg-terracotta/10 text-terracotta transition-colors hover:bg-terracotta/20"
                    onClick={() => onRemove(ingredient.id)}
                    aria-label={`Remove ${ingredient.name}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>

                <div className="flex items-center justify-between gap-2">
                  {canWeigh ? (
                    <div className="flex overflow-hidden rounded-[10px] ring-1 ring-latte/60 bg-warm-white text-xs">
                      <button
                        type="button"
                        className={cn(
                          'px-2.5 py-1 transition-colors',
                          unit === 'serving'
                            ? 'bg-emerald/15 text-emerald-dark font-semibold'
                            : 'text-espresso/55'
                        )}
                        onClick={() => changeUnit('serving')}
                      >
                        serving
                      </button>
                      <button
                        type="button"
                        className={cn(
                          'px-2.5 py-1 transition-colors',
                          unit !== 'serving'
                            ? 'bg-emerald/15 text-emerald-dark font-semibold'
                            : 'text-espresso/55'
                        )}
                        onClick={() => changeUnit(wUnit)}
                      >
                        {wUnit}
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs text-espresso/40">per serving</span>
                  )}

                  {/* Amount stepper */}
                  <div className="flex items-center gap-1 rounded-[10px] bg-warm-white px-1 py-0.5 ring-1 ring-latte/60">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => setAmount(amount - step)}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="metric min-w-[3.5rem] text-center text-sm font-semibold text-espresso">
                      {amount}
                      {unit === 'serving' ? '' : ` ${unit}`}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => setAmount(amount + step)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
