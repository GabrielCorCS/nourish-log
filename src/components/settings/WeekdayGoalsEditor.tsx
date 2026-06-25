import { useEffect, useState } from 'react'
import { NumberField, Button } from '@/components/ui'
import { cn } from '@/lib/utils'
import {
  useUserSettings,
  useWeekdayGoals,
  useUpsertWeekdayGoal,
  useDeleteWeekdayGoal,
} from '@/hooks'
import { useUIStore } from '@/stores'
import { DEFAULT_GOALS } from '@/lib/constants'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

/** Edit optional macro goals for specific days of the week. */
export function WeekdayGoalsEditor() {
  const addToast = useUIStore((s) => s.addToast)
  const { data: settings } = useUserSettings()
  const { data: overrides } = useWeekdayGoals()
  const upsert = useUpsertWeekdayGoal()
  const remove = useDeleteWeekdayGoal()

  const [day, setDay] = useState(() => new Date().getDay())
  const [form, setForm] = useState({ calories: 0, protein: 0, carbs: 0, fat: 0 })

  const overrideFor = (d: number) => overrides?.find((o) => o.weekday === d)
  const hasOverride = !!overrideFor(day)

  // Prefill the inputs from the selected day's override, else the base goals.
  useEffect(() => {
    const o = overrideFor(day)
    setForm(
      o
        ? {
            calories: o.daily_calorie_goal,
            protein: o.daily_protein_goal,
            carbs: o.daily_carbs_goal,
            fat: o.daily_fat_goal,
          }
        : {
            calories: settings?.daily_calorie_goal ?? DEFAULT_GOALS.calories,
            protein: settings?.daily_protein_goal ?? DEFAULT_GOALS.protein,
            carbs: settings?.daily_carbs_goal ?? DEFAULT_GOALS.carbs,
            fat: settings?.daily_fat_goal ?? DEFAULT_GOALS.fat,
          }
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [day, overrides, settings])

  const handleSave = async () => {
    try {
      await upsert.mutateAsync({
        weekday: day,
        daily_calorie_goal: Math.round(form.calories),
        daily_protein_goal: Math.round(form.protein),
        daily_carbs_goal: Math.round(form.carbs),
        daily_fat_goal: Math.round(form.fat),
      })
      addToast(`${DAYS[day]} goals saved`, 'success')
    } catch {
      addToast('Failed to save day goals', 'error')
    }
  }

  const handleReset = async () => {
    try {
      await remove.mutateAsync(day)
      addToast(`${DAYS[day]} reset to default`, 'success')
    } catch {
      addToast('Failed to reset', 'error')
    }
  }

  return (
    <div>
      <p className="mb-3 text-sm text-espresso/55">
        Set different targets for specific days (e.g. more carbs on training days).
        Days you don't customize use your default goals above.
      </p>

      <div className="no-scrollbar mb-4 flex gap-1.5 overflow-x-auto pb-0.5">
        {DAYS.map((d, i) => {
          const active = day === i
          return (
            <button
              key={d}
              type="button"
              onClick={() => setDay(i)}
              className={cn(
                'pressable relative shrink-0 rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors',
                active
                  ? 'bg-gradient-to-r from-emerald to-emerald-dark text-white shadow-soft'
                  : 'bg-cream text-espresso/60 ring-1 ring-latte hover:text-espresso'
              )}
            >
              {d}
              {overrideFor(i) && (
                <span
                  className={cn(
                    'absolute right-1 top-1 h-1.5 w-1.5 rounded-full',
                    active ? 'bg-white' : 'bg-emerald'
                  )}
                />
              )}
            </button>
          )
        })}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <NumberField label="Calories" value={form.calories} onChange={(v) => setForm({ ...form, calories: v })} min={0} />
        <NumberField label="Protein (g)" value={form.protein} onChange={(v) => setForm({ ...form, protein: v })} min={0} />
        <NumberField label="Carbs (g)" value={form.carbs} onChange={(v) => setForm({ ...form, carbs: v })} min={0} />
        <NumberField label="Fat (g)" value={form.fat} onChange={(v) => setForm({ ...form, fat: v })} min={0} />
      </div>

      <div className="mt-4 flex items-center justify-end gap-2">
        {hasOverride && (
          <Button variant="ghost" onClick={handleReset} isLoading={remove.isPending}>
            Reset to default
          </Button>
        )}
        <Button onClick={handleSave} isLoading={upsert.isPending}>
          Save {DAYS[day]}
        </Button>
      </div>
    </div>
  )
}
