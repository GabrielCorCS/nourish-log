import { Plus, Minus, X } from 'lucide-react'
import { Button } from '@/components/ui'
import { IngredientSearch } from '@/components/ingredients/IngredientSearch'
import { useLogMealStore } from '@/stores'
import type { Ingredient } from '@/types/database'

export function IngredientSelector() {
  const {
    selectedIngredients,
    addIngredient,
    updateIngredientQuantity,
    removeIngredient,
  } = useLogMealStore()

  const handleSelect = (ingredient: Ingredient) => {
    if (selectedIngredients.find((si) => si.ingredient.id === ingredient.id)) {
      return
    }
    addIngredient(ingredient, 1)
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <IngredientSearch
        onSelect={handleSelect}
        excludeIds={selectedIngredients.map((si) => si.ingredient.id)}
      />

      {/* Selected */}
      <div className="max-h-[250px] overflow-y-auto space-y-2">
        {selectedIngredients.length === 0 ? (
          <p className="text-center text-sm text-espresso/50 py-8">
            Search and add ingredients above
          </p>
        ) : (
          selectedIngredients.map(({ ingredient, quantity }) => (
            <div
              key={ingredient.id}
              className="flex items-center gap-3 p-3 bg-cream rounded-input"
            >
              <span className="text-lg">{ingredient.emoji || '🍽️'}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-espresso truncate">
                  {ingredient.name}
                </p>
                <p className="text-xs text-espresso/50">
                  {Math.round(ingredient.calories * quantity)} cal ·{' '}
                  {ingredient.serving_size * quantity} {ingredient.serving_unit}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() =>
                    updateIngredientQuantity(
                      ingredient.id,
                      Math.max(0.5, quantity - 0.5)
                    )
                  }
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="w-6 text-center text-sm font-medium">
                  {quantity}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() =>
                    updateIngredientQuantity(ingredient.id, quantity + 0.5)
                  }
                >
                  <Plus className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-terracotta"
                  onClick={() => removeIngredient(ingredient.id)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
