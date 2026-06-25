import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { useViewStore } from '@/stores/viewStore'
import { DEFAULT_GOALS } from '@/lib/constants'
import type { UserSettings, UserSettingsUpdate, UserStreak } from '@/types/database'

const USER_SETTINGS_KEY = ['user-settings']
const USER_STREAKS_KEY = ['user-streaks']

export function useUserSettings() {
  const { user } = useAuth()
  const userId = user?.id

  return useQuery({
    queryKey: [...USER_SETTINGS_KEY, userId],
    queryFn: async () => {
      if (!userId) {
        return {
          daily_calorie_goal: DEFAULT_GOALS.calories,
          daily_protein_goal: DEFAULT_GOALS.protein,
          daily_carbs_goal: DEFAULT_GOALS.carbs,
          daily_fat_goal: DEFAULT_GOALS.fat,
          theme: 'light',
          notifications_enabled: true,
        } as UserSettings
      }

      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return {
            daily_calorie_goal: DEFAULT_GOALS.calories,
            daily_protein_goal: DEFAULT_GOALS.protein,
            daily_carbs_goal: DEFAULT_GOALS.carbs,
            daily_fat_goal: DEFAULT_GOALS.fat,
            theme: 'light',
            notifications_enabled: true,
          } as UserSettings
        }
        throw error
      }

      return data as UserSettings
    },
    enabled: true,
  })
}

export function useUpdateUserSettings() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (updates: UserSettingsUpdate) => {
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('user_settings')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) throw error
      return data as UserSettings
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USER_SETTINGS_KEY })
    },
  })
}

export function useUserStreak() {
  const { user } = useAuth()
  const viewUserId = useViewStore((s) => s.viewUserId)
  const userId = viewUserId ?? user?.id

  return useQuery({
    queryKey: [...USER_STREAKS_KEY, userId],
    queryFn: async () => {
      if (!userId) {
        return {
          current_streak: 0,
          longest_streak: 0,
          last_logged_date: null,
        } as UserStreak
      }

      const { data, error } = await supabase
        .from('user_streaks')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return {
            current_streak: 0,
            longest_streak: 0,
            last_logged_date: null,
          } as UserStreak
        }
        throw error
      }

      return data as UserStreak
    },
    enabled: true,
  })
}

// ── Per-weekday goal overrides ───────────────────────────────────────────────
// Optional macro targets for specific days of the week (e.g. higher carbs on
// training days). Stored as overrides; the base user_settings is the fallback.
// `weekday` is JS getDay(): 0 = Sunday … 6 = Saturday.
export interface WeekdayGoal {
  weekday: number
  daily_calorie_goal: number
  daily_protein_goal: number
  daily_carbs_goal: number
  daily_fat_goal: number
}

const WEEKDAY_GOALS_KEY = ['weekday-goals']

function useWeekdayOverridesFor(userId?: string) {
  return useQuery({
    queryKey: [...WEEKDAY_GOALS_KEY, userId],
    queryFn: async () => {
      if (!userId) return [] as WeekdayGoal[]
      const { data, error } = await supabase
        .from('weekday_goal_overrides')
        .select(
          'weekday, daily_calorie_goal, daily_protein_goal, daily_carbs_goal, daily_fat_goal'
        )
        .eq('user_id', userId)
      if (error) throw error
      return (data ?? []) as WeekdayGoal[]
    },
    enabled: !!userId,
  })
}

/** The current user's weekday overrides (for editing in Settings). */
export function useWeekdayGoals() {
  const { user } = useAuth()
  return useWeekdayOverridesFor(user?.id)
}

export function useUpsertWeekdayGoal() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  return useMutation({
    mutationFn: async (goal: WeekdayGoal) => {
      if (!user) throw new Error('Not authenticated')
      const { error } = await supabase
        .from('weekday_goal_overrides')
        .upsert(
          { user_id: user.id, ...goal, updated_at: new Date().toISOString() },
          { onConflict: 'user_id,weekday' }
        )
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WEEKDAY_GOALS_KEY })
      queryClient.invalidateQueries({ queryKey: USER_SETTINGS_KEY })
    },
  })
}

export function useDeleteWeekdayGoal() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  return useMutation({
    mutationFn: async (weekday: number) => {
      if (!user) throw new Error('Not authenticated')
      const { error } = await supabase
        .from('weekday_goal_overrides')
        .delete()
        .eq('user_id', user.id)
        .eq('weekday', weekday)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WEEKDAY_GOALS_KEY })
      queryClient.invalidateQueries({ queryKey: USER_SETTINGS_KEY })
    },
  })
}

// Goals for whoever the UI is currently viewing (follows the global toggle),
// resolved for `date` (defaults to today) so weekday overrides apply.
export function useGoals(date?: Date) {
  const viewUserId = useViewStore((s) => s.viewUserId)
  return useGoalsFor(viewUserId ?? undefined, date)
}

// Goals for an arbitrary household member (e.g. the partner), for `date`.
export function useGoalsFor(targetUserId?: string, date?: Date) {
  const { user } = useAuth()
  const userId = targetUserId ?? user?.id

  const { data, isLoading } = useQuery({
    queryKey: [...USER_SETTINGS_KEY, 'for', userId],
    queryFn: async () => {
      if (!userId) return null
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle()
      if (error) throw error
      return data as UserSettings | null
    },
    enabled: !!userId,
  })

  const { data: overrides } = useWeekdayOverridesFor(userId)

  const base = {
    calories: data?.daily_calorie_goal ?? DEFAULT_GOALS.calories,
    protein: data?.daily_protein_goal ?? DEFAULT_GOALS.protein,
    carbs: data?.daily_carbs_goal ?? DEFAULT_GOALS.carbs,
    fat: data?.daily_fat_goal ?? DEFAULT_GOALS.fat,
  }

  const weekday = (date ?? new Date()).getDay()
  const override = overrides?.find((o) => o.weekday === weekday)
  const goals = override
    ? {
        calories: override.daily_calorie_goal,
        protein: override.daily_protein_goal,
        carbs: override.daily_carbs_goal,
        fat: override.daily_fat_goal,
      }
    : base

  return { isLoading, goals }
}
