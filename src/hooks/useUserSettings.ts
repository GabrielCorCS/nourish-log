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

// Goals for whoever the UI is currently viewing (follows the global toggle).
// Note: useUserSettings (above) stays self-scoped so the Settings page always
// edits your own goals.
export function useGoals() {
  const viewUserId = useViewStore((s) => s.viewUserId)
  return useGoalsFor(viewUserId ?? undefined)
}

// Goals for an arbitrary household member (e.g. the partner) — for showing
// each other's daily progress against their own targets.
export function useGoalsFor(targetUserId?: string) {
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

  return {
    isLoading,
    goals: {
      calories: data?.daily_calorie_goal ?? DEFAULT_GOALS.calories,
      protein: data?.daily_protein_goal ?? DEFAULT_GOALS.protein,
      carbs: data?.daily_carbs_goal ?? DEFAULT_GOALS.carbs,
      fat: data?.daily_fat_goal ?? DEFAULT_GOALS.fat,
    },
  }
}
