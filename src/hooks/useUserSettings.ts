import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, getCurrentUserId } from '@/lib/supabase'
import { DEFAULT_GOALS } from '@/lib/constants'
import type { UserSettings, UserStreak } from '@/types/database'

const USER_SETTINGS_KEY = ['user-settings']
const USER_STREAKS_KEY = ['user-streaks']

export function useUserSettings() {
  return useQuery({
    queryKey: USER_SETTINGS_KEY,
    queryFn: async () => {
      const userId = await getCurrentUserId()

      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error) {
        // Return default settings if not found
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
  })
}

export function useUpdateUserSettings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (updates: {
      daily_calorie_goal?: number
      daily_protein_goal?: number
      daily_carbs_goal?: number
      daily_fat_goal?: number
      theme?: string
      notifications_enabled?: boolean
    }) => {
      const userId = await getCurrentUserId()

      const { data, error } = await supabase
        .from('user_settings')
        .update(updates)
        .eq('user_id', userId)
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
  return useQuery({
    queryKey: USER_STREAKS_KEY,
    queryFn: async () => {
      const userId = await getCurrentUserId()

      const { data, error } = await supabase
        .from('user_streaks')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error) {
        // Return default streak if not found
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
  })
}

// Helper hook to get goals easily
export function useGoals() {
  const { data: settings, isLoading } = useUserSettings()

  return {
    isLoading,
    goals: {
      calories: settings?.daily_calorie_goal ?? DEFAULT_GOALS.calories,
      protein: settings?.daily_protein_goal ?? DEFAULT_GOALS.protein,
      carbs: settings?.daily_carbs_goal ?? DEFAULT_GOALS.carbs,
      fat: settings?.daily_fat_goal ?? DEFAULT_GOALS.fat,
    },
  }
}
