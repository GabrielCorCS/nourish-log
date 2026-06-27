import { useState, useEffect, useMemo } from 'react'
import { Check, Minus, Plus, X } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
  Button,
  Input,
  StepperField,
} from '@/components/ui'
import { IngredientSearch } from '@/components/ingredients/IngredientSearch'
import { cn } from '@/lib/utils'
import { MEAL_TYPES } from '@/lib/constants'
import { useUpdateFoodEntry, useUpdateFoodEntryWithIngredients } from '@/hooks'
import { useUIStore } from '@/stores'
import {
  scaleIngredient,
  servingsEquivalent,
  servingGramsOf,
  supportsWeightEntry,
  type AmountUnit,
} from '@/lib/nutrition'
import type {
  FoodEntryWithDetails,
  Ingredient,
  MealType,
} from '@/types/database'

interface EditMealModalProps {
  entry: FoodEntryWithDetails | null
  onClose: () => void
}

// A working copy of a logged ingredient row. `rowId` present = existing row.
interface EditRow {
  rowId?: string
  ingredient: Ingredient
  amount: number
  unit: AmountUnit
}

const emptyTotals = { calories: 0, protein: 0, carbs: 0, fat: 0 }

function weightUnitFor(ingredient: Ingredient): AmountUnit {
  return ingredient.serving_unit === 'ml' ? 'ml' : 'g'
}

export function EditMealModal({ entry, onClose }: EditMealModalProps) {
  const updateEntry = useUpdateFoodEntry()
  const updateWithIngredients = useUpdateFoodEntryWithIngredients()
  const addToast = useUIStore((s) => s.addToast)

  const [mealType, setMealType] = useState<MealType>('breakfast')
  const [servings, setServings] = useState(1)
  const [title, setTitle] = useState('')
  const [notes, setNotes] = useState('')
  const [rows, setRows] = useState<EditRow[]>([])
  const [removedIds, setRemovedIds] = useState<string[]>([])

  useEffect(() => {
    if (!entry) return
    setMealType(entry.meal_type)
    setServings(entry.servings || 1)
    setTitle(entry.title ?? '')
    setNotes(entry.notes ?? '')
    setRemovedIds([])
    setRows(
      (entry.food_entry_ingredients ?? [])
        .filter((r) => r.ingredient)
        .map((r) => ({
          rowId: r.id,
          ingredient: r.ingredient,
          amount: r.amount ?? r.quantity ?? 1,
          unit: ((r.unit as AmountUnit) || 'serving') as AmountUnit,
        }))
    )
  }, [entry])

  // Totals derived live from the editable ingredient rows.
  const ingredientTotals = useMemo(
    () =>
      rows.reduce((acc, r) => {
        const n = scaleIngredient(r.ingredient, r.amount, r.unit)
        return {
          calories: acc.calories + n.calories,
          protein: acc.protein + n.protein,
          carbs: acc.carbs + n.carbs,
          fat: acc.fat + n.fat,
        }
      }, { ...emptyTotals }),
    [rows]
  )

  if (!entry) return null

  // Quick-add entries that stored their ingredients get the full ingredient
  // editor. Recipe entries (and legacy rows with no ingredients) keep the
  // simpler servings-scaling editor. Keyed on the original entry — not the live
  // `rows` — so clearing every row doesn't flip the modal into servings mode.
  const ingredientMode =
    !entry.recipe && (entry.food_entry_ingredients?.length ?? 0) > 0

  // Per-single-serving macros, to rescale recipe/legacy entries by servings.
  const baseServings = entry.servings || 1
  const base = entry.recipe
    ? {
        calories: entry.recipe.total_calories / entry.recipe.servings,
        protein: entry.recipe.total_protein / entry.recipe.servings,
        carbs: entry.recipe.total_carbs / entry.recipe.servings,
        fat: entry.recipe.total_fat / entry.recipe.servings,
      }
    : {
        calories: entry.calories / baseServings,
        protein: entry.protein / baseServings,
        carbs: entry.carbs / baseServings,
        fat: entry.fat / baseServings,
      }

  const scaled = {
    calories: base.calories * servings,
    protein: base.protein * servings,
    carbs: base.carbs * servings,
    fat: base.fat * servings,
  }

  const display = ingredientMode ? ingredientTotals : scaled

  const updateRow = (idx: number, patch: Partial<EditRow>) =>
    setRows((rs) => rs.map((r, i) => (i === idx ? { ...r, ...patch } : r)))

  const removeRow = (idx: number) =>
    setRows((rs) => {
      const row = rs[idx]
      if (row?.rowId) setRemovedIds((ids) => [...ids, row.rowId as string])
      return rs.filter((_, i) => i !== idx)
    })

  const addRow = (ingredient: Ingredient) => {
    setRows((rs) =>
      rs.find((r) => r.ingredient.id === ingredient.id)
        ? rs
        : [...rs, { ingredient, amount: 1, unit: 'serving' as AmountUnit }]
    )
  }

  const changeUnit = (idx: number, next: AmountUnit) => {
    const row = rows[idx]
    if (!row || next === row.unit) return
    const eq = servingsEquivalent(row.ingredient, row.amount, row.unit) || 1
    const nextAmount =
      next === 'serving'
        ? Math.round(eq * 100) / 100
        : Math.max(1, Math.round(eq * servingGramsOf(row.ingredient)))
    updateRow(idx, { unit: next, amount: nextAmount })
  }

  const handleSave = async () => {
    try {
      if (ingredientMode) {
        const upserts = rows.map((r) => ({
          id: r.rowId,
          ingredient_id: r.ingredient.id,
          amount: r.amount,
          unit: r.unit,
          quantity: servingsEquivalent(r.ingredient, r.amount, r.unit),
        }))
        await updateWithIngredients.mutateAsync({
          entryId: entry.id,
          meal_type: mealType,
          title: title.trim() || null,
          notes: notes || null,
          servings: 1,
          totals: ingredientTotals,
          upserts,
          deletedIds: removedIds,
        })
      } else {
        await updateEntry.mutateAsync({
          id: entry.id,
          meal_type: mealType,
          servings,
          calories: scaled.calories,
          protein: scaled.protein,
          carbs: scaled.carbs,
          fat: scaled.fat,
          // Recipes keep their own name; only custom entries store a title.
          title: entry.recipe ? null : title.trim() || null,
          notes: notes || null,
        })
      }
      addToast('Meal updated', 'success')
      onClose()
    } catch {
      addToast('Failed to update meal', 'error')
    }
  }

  const isSaving = updateEntry.isPending || updateWithIngredients.isPending

  return (
    <Dialog open={!!entry} onOpenChange={(open) => !open && onClose()}>
      <DialogContent size="md">
        <DialogHeader>
          <div className="mb-3 flex items-center gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[18px] bg-gradient-to-br from-emerald/[0.12] to-emerald/[0.04] text-2xl ring-1 ring-emerald/15">
              {entry.recipe?.emoji || '🍽️'}
            </span>
            <div className="min-w-0 flex-1">
              <DialogTitle className="truncate">
                {entry.recipe?.name || title || 'Quick add'}
              </DialogTitle>
              <p className="metric mt-0.5 text-xs text-espresso/45">
                {Math.round(display.calories)} kcal
                {ingredientMode
                  ? ` · ${rows.length} ingredient${rows.length === 1 ? '' : 's'}`
                  : ` · ${servings} ${servings === 1 ? 'serving' : 'servings'}`}
              </p>
            </div>
          </div>
        </DialogHeader>

        <DialogBody>
          <div className="space-y-5">
            {/* Meal name — for ingredient/quick-add entries (recipes use their own name) */}
            {!entry.recipe && (
              <Input
                label="Meal name"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Steak burrito bowl"
                maxLength={80}
              />
            )}

            {/* Meal type selector */}
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-espresso/55">
                Meal type
              </p>
              <div className="grid grid-cols-4 gap-2">
                {MEAL_TYPES.map((mt) => (
                  <button
                    key={mt.value}
                    type="button"
                    onClick={() => setMealType(mt.value)}
                    className={cn(
                      'pressable flex flex-col items-center gap-1 rounded-[14px] border py-2.5 text-xs font-semibold transition-colors',
                      mealType === mt.value
                        ? 'border-emerald/30 bg-gradient-to-br from-emerald/[0.12] to-emerald/[0.04] text-emerald-dark ring-1 ring-emerald/20'
                        : 'border-latte text-espresso/55 hover:border-emerald/20 hover:bg-latte/30'
                    )}
                  >
                    <span className="text-xl">{mt.emoji}</span>
                    {mt.label}
                  </button>
                ))}
              </div>
            </div>

            {ingredientMode ? (
              /* Per-ingredient editor */
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-espresso/55">
                  Ingredients
                </p>
                <ul className="space-y-2">
                  {rows.map((row, idx) => {
                    const n = scaleIngredient(row.ingredient, row.amount, row.unit)
                    const canWeigh = supportsWeightEntry(row.ingredient)
                    const wUnit = weightUnitFor(row.ingredient)
                    return (
                      <li
                        key={row.rowId ?? `new-${row.ingredient.id}`}
                        className="space-y-2.5 rounded-[18px] bg-cream p-3 ring-1 ring-latte/50"
                      >
                        <div className="flex items-center gap-3">
                          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-warm-white text-lg shadow-soft ring-1 ring-latte/60">
                            {row.ingredient.emoji || '🍽️'}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-espresso">
                              {row.ingredient.name}
                            </p>
                            <p className="metric text-xs text-espresso/45">
                              {Math.round(n.calories)} cal · {Math.round(n.protein)}p{' '}
                              {Math.round(n.carbs)}c {Math.round(n.fat)}f
                            </p>
                          </div>
                          <button
                            type="button"
                            aria-label={`Remove ${row.ingredient.name}`}
                            className="pressable grid h-7 w-7 place-items-center rounded-full bg-terracotta/10 text-terracotta transition-colors hover:bg-terracotta/20"
                            onClick={() => removeRow(idx)}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>

                        <div className="flex items-center justify-between gap-2">
                          {canWeigh ? (
                            <div className="flex overflow-hidden rounded-[10px] bg-warm-white text-xs ring-1 ring-latte/60">
                              <button
                                type="button"
                                className={cn(
                                  'px-2.5 py-1 transition-colors',
                                  row.unit === 'serving'
                                    ? 'bg-emerald/15 font-semibold text-emerald-dark'
                                    : 'text-espresso/55'
                                )}
                                onClick={() => changeUnit(idx, 'serving')}
                              >
                                serving
                              </button>
                              <button
                                type="button"
                                className={cn(
                                  'px-2.5 py-1 transition-colors',
                                  row.unit !== 'serving'
                                    ? 'bg-emerald/15 font-semibold text-emerald-dark'
                                    : 'text-espresso/55'
                                )}
                                onClick={() => changeUnit(idx, wUnit)}
                              >
                                {wUnit}
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-espresso/40">
                              per serving
                            </span>
                          )}

                          <StepperField
                            value={row.amount}
                            step={row.unit === 'serving' ? 0.5 : 10}
                            min={row.unit === 'serving' ? 0.1 : 1}
                            suffix={row.unit !== 'serving' ? row.unit : undefined}
                            onChange={(v) => updateRow(idx, { amount: v })}
                            ariaLabel={`Amount of ${row.ingredient.name}`}
                          />
                        </div>
                      </li>
                    )
                  })}
                </ul>

                {/* Add another ingredient */}
                <details className="group mt-3">
                  <summary className="flex cursor-pointer list-none items-center gap-1.5 text-sm font-semibold text-emerald-dark">
                    <Plus className="h-4 w-4" />
                    Add ingredient
                  </summary>
                  <div className="mt-3">
                    <IngredientSearch
                      onSelect={addRow}
                      placeholder="Search to add an ingredient…"
                      excludeIds={rows.map((r) => r.ingredient.id)}
                    />
                  </div>
                </details>
              </div>
            ) : (
              /* Servings stepper (recipe / legacy entries) */
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-espresso/55">
                  Servings
                </p>
                <div className="flex items-center gap-3 rounded-[14px] bg-cream p-3 ring-1 ring-latte/60">
                  <button
                    type="button"
                    onClick={() =>
                      setServings((s) => Math.max(0.5, Math.round((s - 0.5) * 100) / 100))
                    }
                    className="pressable flex h-9 w-9 items-center justify-center rounded-full bg-warm-white text-espresso shadow-soft ring-1 ring-latte/60 hover:bg-latte/30"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={servings}
                    onChange={(e) => {
                      const raw = e.target.value
                      if (raw === '' || /^\d*\.?\d*$/.test(raw)) {
                        setServings(raw === '' || raw === '.' ? 0 : Number(raw))
                      }
                    }}
                    onBlur={() => setServings((s) => (s < 0.5 ? 0.5 : s))}
                    aria-label="Servings"
                    className="metric flex-1 bg-transparent text-center text-xl font-bold text-espresso focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setServings((s) => Math.round((s + 0.5) * 100) / 100)}
                    className="pressable flex h-9 w-9 items-center justify-center rounded-full bg-warm-white text-espresso shadow-soft ring-1 ring-latte/60 hover:bg-latte/30"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Notes */}
            <Input
              label="Notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional"
            />

            {/* Live macro preview */}
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: 'Cal', value: Math.round(display.calories), color: 'text-terracotta', bg: 'from-terracotta/[0.10] to-terracotta/[0.04] ring-terracotta/15' },
                { label: 'Protein', value: `${Math.round(display.protein)}g`, color: 'text-emerald-dark', bg: 'from-emerald/[0.12] to-emerald/[0.04] ring-emerald/20' },
                { label: 'Carbs', value: `${Math.round(display.carbs)}g`, color: 'text-[#A9791B]', bg: 'from-honey/[0.18] to-honey/[0.06] ring-honey/30' },
                { label: 'Fat', value: `${Math.round(display.fat)}g`, color: 'text-[#C13C7E]', bg: 'from-blush/[0.16] to-blush/[0.05] ring-blush/25' },
              ].map((item) => (
                <div
                  key={item.label}
                  className={`flex flex-col items-center gap-0.5 rounded-[14px] bg-gradient-to-br p-3 ring-1 ${item.bg}`}
                >
                  <span className={`metric text-lg font-bold leading-none ${item.color}`}>
                    {item.value}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wide text-espresso/40">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </DialogBody>

        <DialogFooter>
          <Button
            onClick={handleSave}
            isLoading={isSaving}
            disabled={
              (ingredientMode && rows.length === 0) || (!entry.recipe && !title.trim())
            }
            leftIcon={<Check className="h-4 w-4" />}
          >
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
