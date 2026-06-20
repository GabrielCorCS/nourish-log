import { ArrowLeft, Check } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
  Button,
} from '@/components/ui'
import { MealTypeSelector } from './MealTypeSelector'
import { SourceSelector } from './SourceSelector'
import { RecipeSelector } from './RecipeSelector'
import { IngredientSelector } from './IngredientSelector'
import { ServingSizeInput } from './ServingSizeInput'
import { NutritionPreview } from './NutritionPreview'
import { useLogMealStore, useUIStore } from '@/stores'
import { useCreateFoodEntry } from '@/hooks'
import { useHousehold } from '@/hooks/useHousehold'
import { servingsEquivalent } from '@/lib/nutrition'
import { cn } from '@/lib/utils'

export function LogMealModal() {
  const { isLogMealModalOpen, closeLogMealModal } = useUIStore()
  const addToast = useUIStore((state) => state.addToast)
  const createFoodEntry = useCreateFoodEntry()
  const { data: household } = useHousehold()
  const partner = household?.partner ?? null

  const {
    step,
    setStep,
    mealType,
    source,
    selectedRecipe,
    selectedIngredients,
    servings,
    notes,
    subjectUserId,
    setSubject,
    totalCalories,
    totalProtein,
    totalCarbs,
    totalFat,
    reset,
  } = useLogMealStore()

  const handleClose = () => {
    closeLogMealModal()
    reset()
  }

  const handleBack = () => {
    switch (step) {
      case 'source':
        setStep('meal-type')
        break
      case 'recipe':
      case 'ingredients':
        setStep('source')
        break
      case 'servings':
        setStep(source === 'recipe' ? 'recipe' : 'ingredients')
        break
      case 'preview':
        setStep('servings')
        break
    }
  }

  const handleNext = () => {
    if (step === 'ingredients') {
      setStep('servings')
    } else if (step === 'servings') {
      setStep('preview')
    }
  }

  const handleSubmit = async () => {
    if (!mealType) return

    try {
      await createFoodEntry.mutateAsync({
        entry: {
          recipe_id: selectedRecipe?.id || null,
          meal_type: mealType,
          servings,
          calories: totalCalories,
          protein: totalProtein,
          carbs: totalCarbs,
          fat: totalFat,
          notes: notes || null,
        },
        ingredients:
          source === 'quick-add'
            ? selectedIngredients.map((si) => ({
                ingredientId: si.ingredient.id,
                amount: si.amount,
                unit: si.unit,
                quantity: servingsEquivalent(si.ingredient, si.amount, si.unit),
              }))
            : undefined,
        subjectUserId: subjectUserId ?? undefined,
      })

      addToast('Meal logged successfully!', 'success')
      handleClose()
    } catch {
      addToast('Failed to log meal', 'error')
    }
  }

  const canProceed = () => {
    switch (step) {
      case 'ingredients':
        return selectedIngredients.length > 0
      case 'servings':
        return servings > 0
      default:
        return true
    }
  }

  const getStepTitle = () => {
    switch (step) {
      case 'meal-type':
        return 'What meal is this?'
      case 'source':
        return 'How would you like to log?'
      case 'recipe':
        return 'Select a recipe'
      case 'ingredients':
        return 'Add ingredients'
      case 'servings':
        return 'How many servings?'
      case 'preview':
        return 'Review & Log'
    }
  }

  return (
    <Dialog open={isLogMealModalOpen} onOpenChange={handleClose}>
      <DialogContent size="lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            {step !== 'meal-type' && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 -ml-2"
                onClick={handleBack}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <DialogTitle>{getStepTitle()}</DialogTitle>
          </div>
        </DialogHeader>

        {partner && (
          <div className="flex items-center gap-2 px-1 pt-1 pb-2 text-sm">
            <span className="text-espresso/50">Logging for</span>
            <div className="flex rounded-input border border-latte overflow-hidden">
              <button
                type="button"
                className={cn(
                  'px-3 py-1 transition-colors',
                  !subjectUserId
                    ? 'bg-caramel/15 text-caramel font-medium'
                    : 'text-espresso/60'
                )}
                onClick={() => setSubject(null)}
              >
                You
              </button>
              <button
                type="button"
                className={cn(
                  'px-3 py-1 transition-colors',
                  subjectUserId === partner.id
                    ? 'bg-caramel/15 text-caramel font-medium'
                    : 'text-espresso/60'
                )}
                onClick={() => setSubject(partner.id)}
              >
                {partner.avatar_emoji || '👤'} {partner.name}
              </button>
            </div>
          </div>
        )}

        <DialogBody>
          {step === 'meal-type' && <MealTypeSelector />}
          {step === 'source' && <SourceSelector />}
          {step === 'recipe' && <RecipeSelector />}
          {step === 'ingredients' && <IngredientSelector />}
          {step === 'servings' && <ServingSizeInput />}
          {step === 'preview' && <NutritionPreview />}
        </DialogBody>

        {(step === 'ingredients' || step === 'servings' || step === 'preview') && (
          <DialogFooter>
            {step === 'preview' ? (
              <Button
                onClick={handleSubmit}
                isLoading={createFoodEntry.isPending}
                leftIcon={<Check className="h-4 w-4" />}
              >
                Log Meal
              </Button>
            ) : (
              <Button onClick={handleNext} disabled={!canProceed()}>
                Continue
              </Button>
            )}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
