import { Edit2, Trash2 } from 'lucide-react'
import { Card, Button, Badge } from '@/components/ui'
import { MacroPills } from '@/components/shared'
import { INGREDIENT_CATEGORIES } from '@/lib/constants'
import type { Ingredient } from '@/types/database'

interface IngredientCardProps {
  ingredient: Ingredient
  onEdit?: (ingredient: Ingredient) => void
  onDelete?: (ingredient: Ingredient) => void
}

export function IngredientCard({
  ingredient,
  onEdit,
  onDelete,
}: IngredientCardProps) {
  const category = INGREDIENT_CATEGORIES.find(
    (c) => c.value === ingredient.category
  )

  return (
    <Card variant="elevated" padding="sm" hoverable className="animate-fade-in">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 flex items-center justify-center bg-latte/20 rounded-input text-xl flex-shrink-0">
          {ingredient.emoji || category?.emoji || '🍽️'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h4 className="font-medium text-espresso truncate">
                {ingredient.name}
              </h4>
              <p className="text-xs text-espresso/50">
                {ingredient.serving_size} {ingredient.serving_unit}
              </p>
            </div>
            {!ingredient.is_default && (
              <div className="flex gap-1 flex-shrink-0">
                {onEdit && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => onEdit(ingredient)}
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </Button>
                )}
                {onDelete && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-terracotta hover:bg-terracotta/10"
                    onClick={() => onDelete(ingredient)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            )}
          </div>
          <MacroPills
            calories={ingredient.calories}
            protein={ingredient.protein}
            carbs={ingredient.carbs}
            fat={ingredient.fat}
            className="mt-2"
          />
          {ingredient.is_default && (
            <Badge variant="secondary" size="sm" className="mt-2">
              Default
            </Badge>
          )}
        </div>
      </div>
    </Card>
  )
}
