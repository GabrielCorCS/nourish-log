import { Card } from '@/components/ui'
import { MacroDisplay } from '@/components/shared'
import { useLogMealStore } from '@/stores'
import { useGoals } from '@/hooks'
import { MEAL_TYPES } from '@/lib/constants'

export function NutritionPreview() {
  const {
    mealType,
    selectedRecipe,
    selectedIngredients,
    source,
    servings,
    notes,
    totalCalories,
    totalProtein,
    totalCarbs,
    totalFat,
  } = useLogMealStore()

  const { goals } = useGoals()

  const mealInfo = MEAL_TYPES.find((m) => m.value === mealType)

  return (
    <div className="space-y-4">
      {/* Meal Summary */}
      <Card variant="outline" padding="md">
        <div className="flex items-start gap-3">
          <span className="text-2xl">
            {source === 'recipe'
              ? selectedRecipe?.emoji || '🍽️'
              : '🥗'}
          </span>
          <div className="flex-1">
            <p className="font-medium text-espresso">
              {source === 'recipe'
                ? selectedRecipe?.name
                : `${selectedIngredients.length} ingredients`}
            </p>
            <p className="text-sm text-espresso/50">
              {mealInfo?.emoji} {mealInfo?.label}
              {source === 'recipe' && ` · ${servings} serving${servings !== 1 ? 's' : ''}`}
            </p>
            {notes && (
              <p className="text-sm text-espresso/60 mt-2 italic">"{notes}"</p>
            )}
          </div>
        </div>
      </Card>

      {/* Nutrition */}
      <div className="p-4 bg-cream rounded-card">
        <p className="text-sm font-medium text-espresso mb-4 text-center">
          This meal provides
        </p>
        <MacroDisplay
          calories={totalCalories}
          protein={totalProtein}
          carbs={totalCarbs}
          fat={totalFat}
          layout="grid"
          size="lg"
        />
      </div>

      {/* Progress toward goals */}
      <div className="p-4 bg-cream rounded-card">
        <p className="text-sm font-medium text-espresso mb-4 text-center">
          % of daily goals
        </p>
        <div className="grid grid-cols-4 gap-2 text-center">
          <div>
            <p className="text-xl font-bold text-terracotta">
              {Math.round((totalCalories / goals.calories) * 100)}%
            </p>
            <p className="text-xs text-espresso/50">Calories</p>
          </div>
          <div>
            <p className="text-xl font-bold text-sage">
              {Math.round((totalProtein / goals.protein) * 100)}%
            </p>
            <p className="text-xs text-espresso/50">Protein</p>
          </div>
          <div>
            <p className="text-xl font-bold text-honey">
              {Math.round((totalCarbs / goals.carbs) * 100)}%
            </p>
            <p className="text-xs text-espresso/50">Carbs</p>
          </div>
          <div>
            <p className="text-xl font-bold text-blush">
              {Math.round((totalFat / goals.fat) * 100)}%
            </p>
            <p className="text-xs text-espresso/50">Fat</p>
          </div>
        </div>
      </div>
    </div>
  )
}
