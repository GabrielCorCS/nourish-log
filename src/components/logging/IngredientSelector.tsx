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

      {/* Selected list */}
      <div className="max-h-[300px] overflow-y-auto space-y-2 pr-0.5">
        {selectedIngredients.length === 0 ? (
          <p className="py-8 text-center text-sm text-espresso/45">
            Search and add ingredients above
          </p>
        ) : (
          <ul className="stagger space-y-2">
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
                updateIngredient(ingredient.id, { unit: next, amount: nextAmount })
              }

              const setAmount = (next: number) =>
                updateIngredient(ingredient.id, {
                  amount: Math.max(step, Math.round(next * 100) / 100),
                })

              return (
                <li
                  key={ingredient.id}
                  className="rounded-[22px] bg-gradient-to-br from-emerald/[0.07] to-emerald/[0.02] p-3.5 ring-1 ring-emerald/12 space-y-2.5"
                >
                  {/* Row 1: icon + name + remove */}
                  <div className="flex items-center gap-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-warm-white text-lg shadow-soft ring-1 ring-latte/60">
                      {ingredient.emoji || '🍽️'}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-espresso">
                        {ingredient.name}
                      </p>
                      <p className="metric text-xs text-espresso/45">
                        {Math.round(nutrition.calories)} cal · {Math.round(nutrition.protein)}p{' '}
                        {Math.round(nutrition.carbs)}c {Math.round(nutrition.fat)}f
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0 text-terracotta hover:bg-terracotta/10"
                      onClick={() => removeIngredient(ingredient.id)}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  {/* Row 2: unit toggle + amount stepper */}
                  <div className="flex items-center justify-between gap-2">
                    {canWeigh ? (
                      <div className="flex overflow-hidden rounded-[10px] border border-latte bg-warm-white text-xs">
                        <button
                          type="button"
                          className={cn(
                            'px-3 py-1.5 transition-colors',
                            unit === 'serving'
                              ? 'bg-emerald/15 font-semibold text-emerald-dark'
                              : 'text-espresso/55'
                          )}
                          onClick={() => changeUnit('serving')}
                        >
                          serving
                        </button>
                        <button
                          type="button"
                          className={cn(
                            'px-3 py-1.5 transition-colors',
                            unit !== 'serving'
                              ? 'bg-emerald/15 font-semibold text-emerald-dark'
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

                    {/* Stepper */}
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => setAmount(amount - step)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="metric min-w-[3.5rem] text-center text-sm font-semibold text-espresso">
                        {amount}{unit !== 'serving' ? ` ${unit}` : ''}
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
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
