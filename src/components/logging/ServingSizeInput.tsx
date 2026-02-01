import { Minus, Plus } from 'lucide-react'
import { Button, Input, Textarea } from '@/components/ui'
import { MacroDisplay } from '@/components/shared'
import { useLogMealStore } from '@/stores'

export function ServingSizeInput() {
  const {
    servings,
    setServings,
    notes,
    setNotes,
    selectedRecipe,
    source,
    totalCalories,
    totalProtein,
    totalCarbs,
    totalFat,
  } = useLogMealStore()

  const showServingsControl = source === 'recipe' && selectedRecipe

  return (
    <div className="space-y-6">
      {showServingsControl && (
        <div>
          <label className="block text-sm font-medium text-espresso mb-3">
            Number of servings
          </label>
          <div className="flex items-center justify-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setServings(Math.max(0.5, servings - 0.5))}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className="text-3xl font-bold text-espresso w-16 text-center">
              {servings}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setServings(servings + 0.5)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <div className="p-4 bg-cream rounded-card">
        <p className="text-sm font-medium text-espresso mb-3 text-center">
          Nutrition {showServingsControl && `(${servings} serving${servings !== 1 ? 's' : ''})`}
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

      <Textarea
        label="Notes (optional)"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Add any notes about this meal..."
        rows={2}
      />
    </div>
  )
}
