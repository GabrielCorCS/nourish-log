import { useState } from 'react'
import { Minus, Plus, Check, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui'
import { useLogMealStore, useUIStore } from '@/stores'
import { useCreateFoodEntry } from '@/hooks'
import { getOffServing, type OffMacros } from '@/lib/openfoodfacts'
import { MEAL_TYPES } from '@/lib/constants'

const NUTRIENT_TILES = [
  { key: 'calories', label: 'Cal', tile: 'from-citrus/[0.14] to-terracotta/[0.06] ring-citrus/25', accent: 'text-[#C2410C]' },
  { key: 'protein', label: 'Protein', tile: 'from-emerald/[0.12] to-emerald/[0.04] ring-emerald/20', accent: 'text-emerald-dark' },
  { key: 'carbs', label: 'Carbs', tile: 'from-honey/[0.18] to-honey/[0.06] ring-honey/30', accent: 'text-[#A9791B]' },
  { key: 'fat', label: 'Fat', tile: 'from-blush/[0.16] to-blush/[0.05] ring-blush/25', accent: 'text-[#C13C7E]' },
] as const

const SERVING_PRESETS = [0.5, 1, 2, 3]
const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(n < 10 ? 1 : 0))

/**
 * Confirm + log a scanned product. Defaults to the label's serving (e.g.
 * "1 can (355 ml)") with per-serving nutrition; falls back to grams only when
 * Open Food Facts has no serving info.
 */
export function ScanConfirm() {
  const { scannedProduct, mealType, subjectUserId, setStep, reset } = useLogMealStore()
  const { closeLogMealModal, addToast } = useUIStore()
  const createFoodEntry = useCreateFoodEntry()

  const serving = scannedProduct ? getOffServing(scannedProduct) : null
  const [count, setCount] = useState(1) // serving count
  const [grams, setGrams] = useState(serving?.amount ?? 100) // fallback amount

  if (!scannedProduct || !serving) return null

  const name = scannedProduct.product_name?.trim() || 'Scanned product'
  const brand = scannedProduct.brands?.trim() || null
  const mealLabel = MEAL_TYPES.find((m) => m.value === mealType)?.label ?? 'meal'
  const useServing = serving.hasServing && serving.perServing

  // Nutrition for the chosen amount.
  const base: OffMacros = useServing ? serving.perServing! : serving.per100
  const factor = useServing ? count : grams / 100
  const nutrition: OffMacros = {
    calories: base.calories * factor,
    protein: base.protein * factor,
    carbs: base.carbs * factor,
    fat: base.fat * factor,
  }

  // What the amount reads as, mirroring the label.
  const totalAmount = useServing && serving.amount ? serving.amount * count : grams
  const amountText = serving.amount || !useServing ? `${fmt(totalAmount)} ${serving.unit}` : null

  const handleLog = async () => {
    try {
      await createFoodEntry.mutateAsync({
        entry: {
          recipe_id: null,
          meal_type: mealType,
          servings: useServing ? count : 1,
          calories: Math.round(nutrition.calories),
          protein: Math.round(nutrition.protein),
          carbs: Math.round(nutrition.carbs),
          fat: Math.round(nutrition.fat),
          notes: brand ? `${name} (${brand})` : name,
        },
        subjectUserId: subjectUserId ?? undefined,
      })
      addToast(`Logged ${name}`, 'success')
      closeLogMealModal()
      reset()
    } catch {
      addToast('Failed to log', 'error')
    }
  }

  return (
    <div className="space-y-5">
      {/* Product header */}
      <div className="flex items-center gap-3.5 rounded-[22px] bg-warm-white p-4 ring-1 ring-latte/60">
        <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-2xl bg-cream text-2xl ring-1 ring-latte/50">
          {scannedProduct.image_small_url ? (
            <img src={scannedProduct.image_small_url} alt="" className="h-full w-full object-cover" />
          ) : (
            '🛒'
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-lg font-semibold text-espresso">{name}</p>
          <p className="truncate text-xs text-espresso/50">
            {brand ? `${brand} · ` : ''}for {mealLabel.toLowerCase()}
          </p>
        </div>
      </div>

      {/* Amount — serving-based when the label provides one */}
      <div className="rounded-[22px] bg-gradient-to-br from-emerald/[0.09] to-emerald/[0.03] p-4 ring-1 ring-emerald/15">
        <div className="mb-3 flex items-baseline justify-between">
          <p className="text-xs font-bold uppercase tracking-wide text-espresso/55">
            {useServing ? 'Servings' : 'Amount'}
          </p>
          {useServing && serving.label && (
            <p className="metric text-xs font-medium text-espresso/50">
              1 serving = {serving.label}
            </p>
          )}
        </div>

        <div className="flex items-center justify-center gap-5">
          <button
            type="button"
            onClick={() =>
              useServing ? setCount((c) => Math.max(0.5, +(c - 0.5).toFixed(1))) : setGrams((g) => Math.max(1, g - 10))
            }
            className="pressable grid h-10 w-10 place-items-center rounded-2xl bg-warm-white text-espresso shadow-soft ring-1 ring-latte/60 hover:ring-emerald/40"
          >
            <Minus className="h-4 w-4" />
          </button>
          <div className="metric flex min-w-[6rem] flex-col items-center">
            <span className="text-4xl font-bold leading-none text-espresso">
              {useServing ? fmt(count) : grams}
            </span>
            <span className="mt-1 text-xs font-medium text-espresso/50">
              {useServing ? (count === 1 ? 'serving' : 'servings') : serving.unit}
              {amountText && useServing ? ` · ${amountText}` : ''}
            </span>
          </div>
          <button
            type="button"
            onClick={() =>
              useServing ? setCount((c) => +(c + 0.5).toFixed(1)) : setGrams((g) => g + 10)
            }
            className="pressable grid h-10 w-10 place-items-center rounded-2xl bg-warm-white text-espresso shadow-soft ring-1 ring-latte/60 hover:ring-emerald/40"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        {useServing && (
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            {SERVING_PRESETS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setCount(p)}
                className={`pressable rounded-full px-3 py-1 text-xs font-semibold ring-1 transition-colors ${
                  count === p
                    ? 'bg-emerald text-white ring-emerald'
                    : 'bg-warm-white text-espresso/60 ring-latte/60 hover:ring-emerald/40'
                }`}
              >
                {fmt(p)}×
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Live nutrition */}
      <div className="grid grid-cols-4 gap-2.5">
        {NUTRIENT_TILES.map((t) => (
          <div key={t.key} className={`rounded-[18px] bg-gradient-to-br p-3 text-center ring-1 ${t.tile}`}>
            <span className="metric block text-xl font-bold text-espresso">
              {Math.round(nutrition[t.key])}
            </span>
            <span className={`text-[10px] font-bold uppercase tracking-wide ${t.accent}`}>{t.label}</span>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2">
        <Button
          onClick={handleLog}
          isLoading={createFoodEntry.isPending}
          leftIcon={<Check className="h-4 w-4" />}
          className="w-full"
          size="lg"
        >
          Log {Math.round(nutrition.calories)} kcal
        </Button>
        <button
          type="button"
          onClick={() => setStep('scan')}
          className="pressable mx-auto flex items-center gap-1.5 text-sm font-medium text-espresso/55 hover:text-espresso"
        >
          <RotateCcw className="h-3.5 w-3.5" /> Scan another
        </button>
      </div>
    </div>
  )
}
