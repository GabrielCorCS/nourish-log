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
const AMOUNT_PRESETS = [50, 100, 150, 200]
const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(n < 10 ? 1 : 0))

const scaleMacros = (m: OffMacros, f: number): OffMacros => ({
  calories: m.calories * f,
  protein: m.protein * f,
  carbs: m.carbs * f,
  fat: m.fat * f,
})

/**
 * Confirm + log a scanned product. Defaults to the label's serving (e.g.
 * "1 can (355 ml)") with per-serving nutrition, but you can switch to "By
 * weight/volume" and type an exact measurement (e.g. 130 g) — nutrition then
 * scales off the per-100 values. Falls back to measurement-only when Open Food
 * Facts has no serving info.
 */
export function ScanConfirm() {
  const { scannedProduct, mealType, subjectUserId, setStep, reset } = useLogMealStore()
  const { closeLogMealModal, addToast } = useUIStore()
  const createFoodEntry = useCreateFoodEntry()

  const serving = scannedProduct ? getOffServing(scannedProduct) : null
  const hasServing = !!(serving?.hasServing && serving.perServing)

  // 'serving' = by label serving count; 'amount' = exact grams/ml.
  const [mode, setMode] = useState<'serving' | 'amount'>(
    hasServing ? 'serving' : 'amount'
  )
  const [count, setCount] = useState(1) // serving count
  const [amount, setAmount] = useState(serving?.amount ?? 100) // exact g/ml

  if (!scannedProduct || !serving) return null

  const name = scannedProduct.product_name?.trim() || 'Scanned product'
  const brand = scannedProduct.brands?.trim() || null
  const mealLabel = MEAL_TYPES.find((m) => m.value === mealType)?.label ?? 'meal'
  const unit = serving.unit
  const unitWord = unit === 'ml' ? 'volume' : 'weight'

  // Per-100 basis for exact-measurement mode. Prefer real per-100 data; if the
  // record only carried per-serving values, derive per-100 from them.
  const per100Basis: OffMacros =
    serving.per100.calories > 0
      ? serving.per100
      : serving.perServing && serving.amount
        ? scaleMacros(serving.perServing, 100 / serving.amount)
        : serving.per100

  const useServing = mode === 'serving' && hasServing

  // Nutrition for the chosen amount.
  const nutrition: OffMacros = useServing
    ? scaleMacros(serving.perServing!, count)
    : scaleMacros(per100Basis, amount / 100)

  // What the amount reads as, mirroring the label.
  const totalAmount = useServing && serving.amount ? serving.amount * count : amount
  const amountText =
    useServing && serving.amount ? `${fmt(totalAmount)} ${unit}` : null

  const handleLog = async () => {
    // For exact entries, record servings as the fraction of one label serving
    // (so "130 g" of a 100 g serving reads as 1.3 srv), and note the measure.
    const loggedServings = useServing
      ? count
      : serving.amount
        ? +(amount / serving.amount).toFixed(2)
        : 1
    const measureNote = useServing ? null : `${fmt(amount)} ${unit}`
    const baseNote = brand ? `${name} (${brand})` : name
    try {
      await createFoodEntry.mutateAsync({
        entry: {
          recipe_id: null,
          meal_type: mealType,
          servings: loggedServings,
          calories: Math.round(nutrition.calories),
          protein: Math.round(nutrition.protein),
          carbs: Math.round(nutrition.carbs),
          fat: Math.round(nutrition.fat),
          notes: measureNote ? `${baseNote} · ${measureNote}` : baseNote,
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

  const step = useServing ? 0.5 : 10
  const adjust = (dir: 1 | -1) => {
    if (useServing) {
      setCount((c) => Math.max(0.5, +(c + dir * step).toFixed(1)))
    } else {
      setAmount((a) => Math.max(1, +(a + dir * step).toFixed(1)))
    }
  }
  const onValueInput = (raw: string) => {
    const v = raw === '' ? 0 : Number(raw)
    if (!Number.isFinite(v)) return
    if (useServing) setCount(Math.max(0, v))
    else setAmount(Math.max(0, v))
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

      {/* Amount — toggle between label servings and an exact measurement */}
      <div className="rounded-[22px] bg-gradient-to-br from-emerald/[0.09] to-emerald/[0.03] p-4 ring-1 ring-emerald/15">
        {/* Mode toggle (only when the label carries a real serving) */}
        {hasServing && (
          <div className="mb-3 grid grid-cols-2 gap-1.5 rounded-[14px] bg-warm-white/70 p-1 ring-1 ring-latte/60">
            {([
              { val: 'serving', label: 'Servings' },
              { val: 'amount', label: `By ${unitWord}` },
            ] as const).map((opt) => (
              <button
                key={opt.val}
                type="button"
                onClick={() => setMode(opt.val)}
                className={`pressable rounded-[11px] py-1.5 text-xs font-bold transition-colors ${
                  mode === opt.val
                    ? 'bg-emerald text-white shadow-soft'
                    : 'text-espresso/55 hover:text-espresso'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}

        <div className="mb-3 flex items-baseline justify-between">
          <p className="text-xs font-bold uppercase tracking-wide text-espresso/55">
            {useServing ? 'Servings' : unit === 'ml' ? 'Volume' : 'Weight'}
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
            onClick={() => adjust(-1)}
            className="pressable grid h-10 w-10 place-items-center rounded-2xl bg-warm-white text-espresso shadow-soft ring-1 ring-latte/60 hover:ring-emerald/40"
          >
            <Minus className="h-4 w-4" />
          </button>
          <div className="metric flex min-w-[7rem] flex-col items-center">
            <input
              type="number"
              inputMode="decimal"
              min={0}
              step={useServing ? 0.5 : 1}
              value={useServing ? count : amount}
              onChange={(e) => onValueInput(e.target.value)}
              onFocus={(e) => e.target.select()}
              aria-label={useServing ? 'Number of servings' : `Amount in ${unit}`}
              className="w-full bg-transparent text-center text-4xl font-bold leading-none text-espresso outline-none focus:text-emerald-dark [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
            <span className="mt-1 text-xs font-medium text-espresso/50">
              {useServing ? (count === 1 ? 'serving' : 'servings') : unit}
              {amountText && useServing ? ` · ${amountText}` : ''}
            </span>
          </div>
          <button
            type="button"
            onClick={() => adjust(1)}
            className="pressable grid h-10 w-10 place-items-center rounded-2xl bg-warm-white text-espresso shadow-soft ring-1 ring-latte/60 hover:ring-emerald/40"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        {/* Quick presets — serving multiples or common gram/ml amounts */}
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          {useServing
            ? SERVING_PRESETS.map((p) => (
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
              ))
            : AMOUNT_PRESETS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setAmount(p)}
                  className={`pressable rounded-full px-3 py-1 text-xs font-semibold ring-1 transition-colors ${
                    amount === p
                      ? 'bg-emerald text-white ring-emerald'
                      : 'bg-warm-white text-espresso/60 ring-latte/60 hover:ring-emerald/40'
                  }`}
                >
                  {p} {unit}
                </button>
              ))}
        </div>
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
