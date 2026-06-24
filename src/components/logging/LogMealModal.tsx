import { useCallback, useEffect, useRef, useState, lazy, Suspense } from 'react'
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
import { LogHub } from './LogHub'
import type { ScanStatus } from './BarcodeScanView'
import { ScanConfirm } from './ScanConfirm'
import { RecipeSelector } from './RecipeSelector'
import { IngredientSelector } from './IngredientSelector'
import { ServingSizeInput } from './ServingSizeInput'
import { NutritionPreview } from './NutritionPreview'
import { useLogMealStore, useUIStore, type LogStep } from '@/stores'
import { useCreateFoodEntry } from '@/hooks'

// Lazy: keeps the heavy @zxing barcode reader out of the initial bundle until
// the user actually opens the scan step.
const BarcodeScanView = lazy(() =>
  import('./BarcodeScanView').then((m) => ({ default: m.BarcodeScanView }))
)
import { useHousehold } from '@/hooks/useHousehold'
import { servingsEquivalent } from '@/lib/nutrition'
import { getProductByBarcode } from '@/lib/openfoodfacts'
import { cn } from '@/lib/utils'

const TITLES: Record<LogStep, string> = {
  'hub': 'Log food',
  'scan': 'Scan barcode',
  'scan-confirm': 'Confirm food',
  'recipe': 'Choose a recipe',
  'ingredients': 'Build your food',
  'servings': 'How much?',
  'preview': 'Review & log',
}

export function LogMealModal() {
  const { isLogMealModalOpen, closeLogMealModal, addToast } = useUIStore()
  const createFoodEntry = useCreateFoodEntry()
  const { data: household } = useHousehold()
  const members = household?.members ?? []
  const meId = household?.me?.id ?? null

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
    setScannedProduct,
    totalCalories,
    totalProtein,
    totalCarbs,
    totalFat,
    reset,
  } = useLogMealStore()

  const [scanStatus, setScanStatus] = useState<ScanStatus>('searching')
  const handlingRef = useRef(false)

  // Reset the scanner whenever we (re)enter the scan step.
  useEffect(() => {
    if (step === 'scan') {
      setScanStatus('searching')
      handlingRef.current = false
    }
  }, [step])

  const handleClose = () => {
    closeLogMealModal()
    reset()
  }

  const handleDetected = useCallback(
    async (barcode: string) => {
      if (handlingRef.current) return
      handlingRef.current = true
      setScanStatus('reading')
      try {
        const product = await getProductByBarcode(barcode)
        if (product) {
          setScanStatus('found')
          setScannedProduct(product)
          setStep('scan-confirm')
        } else {
          setScanStatus('error')
          addToast('No product found for that barcode', 'error')
          window.setTimeout(() => {
            setScanStatus('searching')
            handlingRef.current = false
          }, 1400)
        }
      } catch {
        setScanStatus('error')
        addToast('Lookup failed — try again', 'error')
        window.setTimeout(() => {
          setScanStatus('searching')
          handlingRef.current = false
        }, 1400)
      }
    },
    [addToast, setScannedProduct, setStep]
  )

  const handleBack = () => {
    switch (step) {
      case 'scan':
      case 'recipe':
      case 'ingredients':
        setStep('hub')
        break
      case 'scan-confirm':
        setStep('scan')
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
    if (step === 'ingredients') setStep('servings')
    else if (step === 'servings') setStep('preview')
  }

  const handleSubmit = async () => {
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
    if (step === 'ingredients') return selectedIngredients.length > 0
    if (step === 'servings') return servings > 0
    return true
  }

  const showFooter = step === 'ingredients' || step === 'servings' || step === 'preview'

  return (
    <Dialog open={isLogMealModalOpen} onOpenChange={handleClose}>
      <DialogContent size="lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            {step !== 'hub' && (
              <Button
                variant="ghost"
                size="icon"
                className="-ml-2 h-8 w-8"
                onClick={handleBack}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <DialogTitle className="font-display">{TITLES[step]}</DialogTitle>
          </div>
        </DialogHeader>

        {/* Who is this log for? Always shows the household by name (required). */}
        {members.length > 1 && (
          <div className="px-1 pb-1 pt-0.5">
            <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-espresso/45">
              Who is this for?
            </p>
            <div className="grid grid-cols-2 gap-2">
              {members.map((m) => {
                const selected = (subjectUserId ?? meId) === m.id
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setSubject(m.id)}
                    className={cn(
                      'pressable flex items-center justify-center gap-2 rounded-[14px] py-2.5 text-sm font-semibold ring-1 transition-colors',
                      selected
                        ? 'bg-emerald/12 text-emerald-dark ring-emerald/30'
                        : 'bg-warm-white text-espresso/55 ring-latte/60 hover:ring-emerald/30'
                    )}
                  >
                    <span className="text-base">{m.avatar_emoji || '👤'}</span>
                    {m.name}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        <DialogBody>
          {step === 'hub' && <LogHub />}
          {step === 'scan' && (
            <Suspense fallback={null}>
              <BarcodeScanView status={scanStatus} onDetected={handleDetected} />
            </Suspense>
          )}
          {step === 'scan-confirm' && <ScanConfirm />}
          {step === 'recipe' && <RecipeSelector />}
          {step === 'ingredients' && <IngredientSelector />}
          {step === 'servings' && <ServingSizeInput />}
          {step === 'preview' && <NutritionPreview />}
        </DialogBody>

        {showFooter && (
          <DialogFooter>
            {step === 'preview' ? (
              <Button
                onClick={handleSubmit}
                isLoading={createFoodEntry.isPending}
                leftIcon={<Check className="h-4 w-4" />}
                className="w-full sm:w-auto"
              >
                Log meal
              </Button>
            ) : (
              <Button onClick={handleNext} disabled={!canProceed()} className="w-full sm:w-auto">
                Continue
              </Button>
            )}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
