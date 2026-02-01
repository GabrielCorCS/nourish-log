import { useState } from 'react'
import { Search, Plus, Minus, X } from 'lucide-react'
import { Input, Button, Card } from '@/components/ui'
import { useIngredients } from '@/hooks'
import { useLogMealStore } from '@/stores'
import type { Ingredient } from '@/types/database'

export function IngredientSelector() {
  const [search, setSearch] = useState('')
  const { data: ingredients } = useIngredients()

  const {
    selectedIngredients,
    addIngredient,
    updateIngredientQuantity,
    removeIngredient,
  } = useLogMealStore()

  const filteredIngredients = ingredients?.filter(
    (ingredient) =>
      ingredient.name.toLowerCase().includes(search.toLowerCase()) &&
      !selectedIngredients.find((si) => si.ingredient.id === ingredient.id)
  )

  const handleAdd = (ingredient: Ingredient) => {
    addIngredient(ingredient, 1)
    setSearch('')
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Input
          placeholder="Search ingredients..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          leftIcon={<Search className="h-4 w-4" />}
        />

        {search && filteredIngredients && filteredIngredients.length > 0 && (
          <Card
            variant="elevated"
            padding="none"
            className="absolute top-full left-0 right-0 mt-1 z-10 max-h-40 overflow-y-auto"
          >
            {filteredIngredients.slice(0, 8).map((ingredient) => (
              <button
                key={ingredient.id}
                onClick={() => handleAdd(ingredient)}
                className="w-full flex items-center gap-3 px-3 py-2 hover:bg-latte/20 transition-colors text-left"
              >
                <span>{ingredient.emoji || '🍽️'}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-espresso truncate">
                    {ingredient.name}
                  </p>
                  <p className="text-xs text-espresso/50">
                    {ingredient.calories} cal per {ingredient.serving_size}{' '}
                    {ingredient.serving_unit}
                  </p>
                </div>
                <Plus className="h-4 w-4 text-caramel flex-shrink-0" />
              </button>
            ))}
          </Card>
        )}
      </div>

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
