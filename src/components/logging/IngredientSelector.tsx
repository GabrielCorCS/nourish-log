import { Plus, Minus, X } from 'lucide-react'
import { Button } from '@/components/ui'
import { IngredientSearch } from '@/components/ingredients/IngredientSearch'
import { useLogMealStore } from '@/stores'
import { cn } from '@/lib/utils'
import {
  scaleIngredient,
  supportsWeightEntry,
  servingGramsOf,
  servingsEquivalent,
  type AmountUnit,
} from '@/lib/nutrition'
import type { Ingredient } from '@/types/database'

// The weight unit to offer alongside "serving" (ml for liquids, g otherwise)
function weightUnitFor(ingredient: Ingredient): AmountUnit {
  return ingredient.serving_unit === 'ml' ? 'ml' : 'g'
}

export function IngredientSelector() {
  const { selectedIngredients, addIngredient, updateIngredient, removeIngredient } =
    useLogMealStore()

  const handleSelect = (ingredient: Ingredient) => {
    if (selectedIngredients.find((si) => si.ingredient.id === ingredient.id)) {
      return
    }
    addIngredient(ingredient, 1, 'serving')
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <IngredientSearch
        onSelect={handleSelect}
        excludeIds={selectedIngredients.map((si) => si.ingredient.id)}
      />

      {/* Selected */}
      <div className="max-h-[300px] overflow-y-auto space-y-2">
        {selectedIngredients.length === 0 ? (
          <p className="text-center text-sm text-espresso/50 py-8">
            Search and add ingredients above
          </p>
        ) : (
          selectedIngredients.map(({ ingredient, amount, unit }) => {
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
              updateIngredient(ingredient.id, { unit: next, amount: nextAmount })
            }

            const setAmount = (next: number) =>
              updateIngredient(ingredient.id, {
                amount: Math.max(step, Math.round(next * 100) / 100),
              })

            return (
              <div key={ingredient.id} className="p-3 bg-cream rounded-input space-y-2">
                <div className="flex items-center gap-3">
                  <span className="text-lg">{ingredient.emoji || '🍽️'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-espresso truncate">
                      {ingredient.name}
                    </p>
                    <p className="text-xs text-espresso/50">
                      {Math.round(nutrition.calories)} cal · {Math.round(nutrition.protein)}p{' '}
                      {Math.round(nutrition.carbs)}c {Math.round(nutrition.fat)}f
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-terracotta"
                    onClick={() => removeIngredient(ingredient.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>

                <div className="flex items-center justify-between gap-2">
                  {/* Unit toggle: serving vs g/ml */}
                  {canWeigh ? (
                    <div className="flex rounded-input border border-latte overflow-hidden text-xs bg-warm-white">
                      <button
                        type="button"
                        className={cn(
                          'px-2.5 py-1 transition-colors',
                          unit === 'serving'
                            ? 'bg-caramel/15 text-caramel font-medium'
                            : 'text-espresso/60'
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
                            ? 'bg-caramel/15 text-caramel font-medium'
                            : 'text-espresso/60'
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
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => setAmount(amount - step)}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="min-w-[3.5rem] text-center text-sm font-medium">
                      {amount}
                      {unit === 'serving' ? '' : ` ${unit}`}
                    </span>
                    <Button
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
          })
        )}
      </div>
    </div>
  )
}
