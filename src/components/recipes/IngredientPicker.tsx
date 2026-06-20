import { Plus, Minus, X } from 'lucide-react'
import { Button } from '@/components/ui'
import { IngredientSearch } from '@/components/ingredients/IngredientSearch'
import type { Ingredient } from '@/types/database'

interface SelectedIngredient {
  ingredient: Ingredient
  quantity: number
}

interface IngredientPickerProps {
  selectedIngredients: SelectedIngredient[]
  onAdd: (ingredient: Ingredient, quantity: number) => void
  onRemove: (ingredientId: string) => void
  onUpdateQuantity: (ingredientId: string, quantity: number) => void
}

export function IngredientPicker({
  selectedIngredients,
  onAdd,
  onRemove,
  onUpdateQuantity,
}: IngredientPickerProps) {
  const handleSelect = (ingredient: Ingredient) => {
    if (selectedIngredients.find((si) => si.ingredient.id === ingredient.id)) {
      return
    }
    onAdd(ingredient, 1)
  }

  return (
    <div className="space-y-4">
      {/* Search and Add */}
      <IngredientSearch
        onSelect={handleSelect}
        placeholder="Search ingredients to add..."
        excludeIds={selectedIngredients.map((si) => si.ingredient.id)}
      />

      {/* Selected Ingredients */}
      {selectedIngredients.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-espresso">
            Selected ({selectedIngredients.length})
          </p>
          {selectedIngredients.map(({ ingredient, quantity }) => (
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
                  {ingredient.serving_size} {ingredient.serving_unit} per
                  serving
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() =>
                    onUpdateQuantity(ingredient.id, Math.max(0.5, quantity - 0.5))
                  }
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="w-8 text-center text-sm font-medium">
                  {quantity}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => onUpdateQuantity(ingredient.id, quantity + 0.5)}
                >
                  <Plus className="h-3 w-3" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-terracotta"
                  onClick={() => onRemove(ingredient.id)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
