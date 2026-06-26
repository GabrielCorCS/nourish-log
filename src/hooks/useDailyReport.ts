import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useHousehold } from '@/hooks/useHousehold'
import { getDayRange } from '@/lib/dates'
import { DEFAULT_GOALS } from '@/lib/constants'
import type { FoodEntryWithDetails } from '@/types/database'

export interface MemberReport {
  userId: string
  name: string
  emoji: string
  goals: { calories: number; protein: number; carbs: number; fat: number }
  totals: { calories: number; protein: number; carbs: number; fat: number }
  entries: FoodEntryWithDetails[]
  weight: { value: number; unit: string; delta: number | null } | null
}

/**
 * Pulls the full per-member breakdown for a single day across the household:
 * every logged entry (with recipe/ingredient detail), macro totals vs. each
 * person's resolved goals (incl. weekday overrides), and the day's weigh-in
 * with its change from the previous reading. Members are ordered by name so
 * the report reads Gabriel → Kaylin.
 */
export function useDailyReport(date: Date) {
  const { data: household } = useHousehold()
  const memberIds = (household?.members ?? []).map((m) => m.id)
  const { start, end } = getDayRange(date)
  const weekday = date.getDay()

  return useQuery({
    queryKey: ['daily-report', start, memberIds.join(',')],
    enabled: memberIds.length > 0,
    queryFn: async (): Promise<MemberReport[]> => {
      const [entriesRes, settingsRes, overridesRes, weightsRes] = await Promise.all([
        supabase
          .from('food_entries')
          .select(
            `*, recipe:recipes(*), food_entry_ingredients(*, ingredient:ingredients(*))`,
          )
          .in('user_id', memberIds)
          .gte('logged_at', start)
          .lte('logged_at', end)
          .order('logged_at', { ascending: true }),
        supabase
          .from('user_settings')
          .select(
            'user_id,daily_calorie_goal,daily_protein_goal,daily_carbs_goal,daily_fat_goal,weight_unit',
          )
          .in('user_id', memberIds),
        supabase
          .from('weekday_goal_overrides')
          .select(
            'user_id,weekday,daily_calorie_goal,daily_protein_goal,daily_carbs_goal,daily_fat_goal',
          )
          .in('user_id', memberIds)
          .eq('weekday', weekday),
        // All weigh-ins up to end-of-day, newest first, so we can read the day's
        // value and the one before it for a delta.
        supabase
          .from('body_metrics')
          .select('user_id,weight_kg,measured_at')
          .in('user_id', memberIds)
          .not('weight_kg', 'is', null)
          .lte('measured_at', end)
          .order('measured_at', { ascending: false })
          .limit(60),
      ])

      const entries = (entriesRes.data ?? []) as FoodEntryWithDetails[]
      const settings = settingsRes.data ?? []
      const overrides = overridesRes.data ?? []
      const weights = weightsRes.data ?? []

      const members = (household?.members ?? [])
        .slice()
        .sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''))

      return members.map((m): MemberReport => {
        const s = settings.find((x) => x.user_id === m.id)
        const ov = overrides.find((x) => x.user_id === m.id)
        const goals = {
          calories: ov?.daily_calorie_goal ?? s?.daily_calorie_goal ?? DEFAULT_GOALS.calories,
          protein: ov?.daily_protein_goal ?? s?.daily_protein_goal ?? DEFAULT_GOALS.protein,
          carbs: ov?.daily_carbs_goal ?? s?.daily_carbs_goal ?? DEFAULT_GOALS.carbs,
          fat: ov?.daily_fat_goal ?? s?.daily_fat_goal ?? DEFAULT_GOALS.fat,
        }

        const mine = entries.filter((e) => e.user_id === m.id)
        const totals = mine.reduce(
          (acc, e) => ({
            calories: acc.calories + e.calories,
            protein: acc.protein + e.protein,
            carbs: acc.carbs + e.carbs,
            fat: acc.fat + e.fat,
          }),
          { calories: 0, protein: 0, carbs: 0, fat: 0 },
        )

        const unit = s?.weight_unit ?? 'lb'
        const toUnit = (kg: number) => (unit === 'kg' ? kg : kg * 2.20462)
        const myWeights = weights.filter((w) => w.user_id === m.id) // newest first
        const inDay = myWeights.find((w) => w.measured_at >= start && w.measured_at <= end)
        let weight: MemberReport['weight'] = null
        if (inDay?.weight_kg != null) {
          const prev = myWeights[myWeights.indexOf(inDay) + 1]
          const value = toUnit(Number(inDay.weight_kg))
          const delta =
            prev?.weight_kg != null ? value - toUnit(Number(prev.weight_kg)) : null
          weight = { value, unit, delta }
        }

        return {
          userId: m.id,
          name: m.name ?? 'Member',
          emoji: m.avatar_emoji ?? '👤',
          goals,
          totals,
          entries: mine,
          weight,
        }
      })
    },
  })
}
