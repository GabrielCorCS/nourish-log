import { Edit2, Trash2 } from 'lucide-react'
import { Button, Badge } from '@/components/ui'
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
    <div className="pressable relative flex flex-col gap-3 rounded-[22px] bg-warm-white p-4 ring-1 ring-latte/60 transition-shadow hover:shadow-soft">
      <div className="flex items-start gap-3">
        {/* Category emoji avatar */}
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald/[0.12] to-emerald/[0.04] text-2xl ring-1 ring-emerald/15">
          {ingredient.emoji || category?.emoji || '🍽️'}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h4 className="truncate font-display text-base font-semibold leading-tight text-espresso">
                {ingredient.name}
              </h4>
              <p className="text-xs text-espresso/50">
                {ingredient.serving_size} {ingredient.serving_unit}
              </p>
            </div>

            {!ingredient.is_default && (
              <div className="flex shrink-0 gap-0.5">
                {onEdit && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-espresso/40 hover:text-emerald-dark"
                    onClick={() => onEdit(ingredient)}
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </Button>
                )}
                {onDelete && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-espresso/30 hover:text-terracotta hover:bg-terracotta/10"
                    onClick={() => onDelete(ingredient)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Macro pills + optional default badge */}
      <div className="flex items-center justify-between gap-2">
        <MacroPills
          calories={ingredient.calories}
          protein={ingredient.protein}
          carbs={ingredient.carbs}
          fat={ingredient.fat}
        />
        {ingredient.is_default && (
          <Badge variant="secondary" size="sm">
            Default
          </Badge>
        )}
      </div>
    </div>
  )
}
