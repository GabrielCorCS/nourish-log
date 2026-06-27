import { useState } from 'react'
import { Sparkles, Wand2, RotateCcw, Check } from 'lucide-react'
import { Button, Input, NumberField, Textarea } from '@/components/ui'
import { MacroDisplay } from '@/components/shared'
import { useLogMealStore, useUIStore } from '@/stores'
import { useCreateFoodEntry } from '@/hooks'
import { MEAL_TYPES } from '@/lib/constants'
import {
  parseMeal,
  sumItems,
  AINotConfiguredError,
  type AIMealResult,
  type AIMealTotals,
} from '@/lib/aiMeal'

const EXAMPLES = [
  'Two scrambled eggs, a slice of sourdough toast with butter, and a banana',
  'Chicken caesar salad and an iced latte',
  'A bowl of oatmeal with blueberries, peanut butter, and honey',
]

/**
 * AI logging: describe a meal in plain language and Claude estimates the items
 * and macros. The reviewed result is logged as a single titled entry through the
 * same path as quick-add / re-log, so the journal and daily report treat it
 * identically.
 */
export function AICompose() {
  const { mealType, subjectUserId, reset } = useLogMealStore()
  const { closeLogMealModal, addToast } = useUIStore()
  const createFoodEntry = useCreateFoodEntry()

  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<AIMealResult | null>(null)
  const [title, setTitle] = useState('')
  const [totals, setTotals] = useState<AIMealTotals>({ calories: 0, protein: 0, carbs: 0, fat: 0 })

  const mealInfo = MEAL_TYPES.find((m) => m.value === mealType)

  const handleEstimate = async () => {
    const description = text.trim()
    if (!description) return
    setLoading(true)
    try {
      const res = await parseMeal(description)
      setResult(res)
      setTitle(res.title)
      setTotals(sumItems(res.items))
    } catch (err) {
      if (err instanceof AINotConfiguredError) {
        addToast('AI logging needs setup — add the ANTHROPIC_API_KEY secret.', 'error')
      } else {
        addToast("Couldn't read that meal — try rephrasing.", 'error')
      }
    } finally {
      setLoading(false)
    }
  }

  const startOver = () => {
    setResult(null)
    setTitle('')
  }

  const handleLog = async () => {
    if (!result || !title.trim()) return
    try {
      await createFoodEntry.mutateAsync({
        entry: {
          recipe_id: null,
          meal_type: mealType,
          servings: 1,
          calories: totals.calories,
          protein: totals.protein,
          carbs: totals.carbs,
          fat: totals.fat,
          title: title.trim(),
          notes: result.items.map((i) => `${i.quantity} ${i.name}`).join(', '),
        },
        subjectUserId: subjectUserId ?? undefined,
      })
      addToast('Logged ' + title.trim(), 'success')
      reset()
      closeLogMealModal()
    } catch {
      addToast('Failed to log', 'error')
    }
  }

  // ── Describe step ─────────────────────────────────────────────────────────
  if (!result) {
    return (
      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-[22px] bg-gradient-to-br from-honey/[0.18] to-honey/[0.06] p-4 ring-1 ring-honey/30">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-warm-white text-[#A9791B] shadow-soft">
            <Sparkles className="h-5 w-5" />
          </span>
          <p className="text-sm text-espresso/70">
            Describe what you ate in a sentence and Claude will estimate the items and macros.
            You can fine-tune everything before logging.
          </p>
        </div>

        <Textarea
          label="What did you eat?"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="e.g. Two scrambled eggs, sourdough toast with butter, and a banana"
          rows={3}
          maxLength={1000}
          autoFocus
        />

        <div>
          <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-espresso/45">
            Try one of these
          </p>
          <div className="flex flex-col gap-1.5">
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                type="button"
                onClick={() => setText(ex)}
                className="pressable rounded-[14px] bg-warm-white px-3 py-2 text-left text-sm text-espresso/70 ring-1 ring-latte/60 hover:ring-emerald/30"
              >
                {ex}
              </button>
            ))}
          </div>
        </div>

        <Button
          variant="accent"
          onClick={handleEstimate}
          isLoading={loading}
          disabled={!text.trim()}
          leftIcon={<Wand2 className="h-4 w-4" />}
          className="w-full"
        >
          {loading ? 'Estimating…' : 'Estimate nutrition'}
        </Button>
      </div>
    )
  }

  // ── Review step ───────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      <Input
        label="Meal name"
        required
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Name this meal"
        maxLength={80}
      />

      {/* Identity + meal type */}
      <div className="flex items-center gap-3 rounded-[22px] bg-warm-white p-4 ring-1 ring-latte/60">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-cream text-2xl shadow-soft ring-1 ring-latte/40">
          {result.emoji || '🍽️'}
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-display font-semibold text-espresso">{title.trim() || 'Untitled meal'}</p>
          <p className="metric text-sm text-espresso/50">
            {mealInfo?.emoji} {mealInfo?.label}
          </p>
        </div>
      </div>

      {/* Parsed items */}
      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-espresso/45">
          Claude found {result.items.length} item{result.items.length !== 1 ? 's' : ''}
        </p>
        <ul className="space-y-1.5">
          {result.items.map((i, idx) => (
            <li
              key={`${i.name}-${idx}`}
              className="flex items-center justify-between rounded-[14px] bg-warm-white px-3 py-2 text-sm ring-1 ring-latte/50"
            >
              <span className="min-w-0 truncate text-espresso">
                <span className="text-espresso/55">{i.quantity}</span> {i.name}
              </span>
              <span className="metric shrink-0 pl-2 text-espresso/45">{Math.round(i.calories)} cal</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Editable totals — AI estimates are a starting point */}
      <div className="rounded-[22px] bg-cream p-4 ring-1 ring-latte/40">
        <p className="mb-3 text-center text-xs font-bold uppercase tracking-wide text-espresso/55">
          Totals — adjust if needed
        </p>
        <MacroDisplay
          calories={totals.calories}
          protein={totals.protein}
          carbs={totals.carbs}
          fat={totals.fat}
          layout="grid"
          size="lg"
        />
        <div className="mt-3 grid grid-cols-2 gap-2">
          <NumberField
            label="Calories"
            value={Math.round(totals.calories)}
            onChange={(v) => setTotals((t) => ({ ...t, calories: v }))}
            min={0}
            allowDecimals={false}
          />
          <NumberField
            label="Protein (g)"
            value={Math.round(totals.protein)}
            onChange={(v) => setTotals((t) => ({ ...t, protein: v }))}
            min={0}
            allowDecimals={false}
          />
          <NumberField
            label="Carbs (g)"
            value={Math.round(totals.carbs)}
            onChange={(v) => setTotals((t) => ({ ...t, carbs: v }))}
            min={0}
            allowDecimals={false}
          />
          <NumberField
            label="Fat (g)"
            value={Math.round(totals.fat)}
            onChange={(v) => setTotals((t) => ({ ...t, fat: v }))}
            min={0}
            allowDecimals={false}
          />
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={startOver}
          leftIcon={<RotateCcw className="h-4 w-4" />}
          className="flex-1"
        >
          Start over
        </Button>
        <Button
          onClick={handleLog}
          isLoading={createFoodEntry.isPending}
          disabled={!title.trim()}
          leftIcon={<Check className="h-4 w-4" />}
          className="flex-1"
        >
          Log meal
        </Button>
      </div>
    </div>
  )
}
