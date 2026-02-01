import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useUserStore } from '@/stores/userStore'
import { DEFAULT_GOALS } from '@/lib/constants'
import type { UserSettings, UserSettingsUpdate, UserStreak } from '@/types/database'

const USER_SETTINGS_KEY = ['user-settings']
const USER_STREAKS_KEY = ['user-streaks']

export function useUserSettings() {
  const { currentUser } = useUserStore()
  const userId = currentUser?.id

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
    enabled: true,
  })
}

export function useUpdateUserSettings() {
  const queryClient = useQueryClient()
  const { currentUser } = useUserStore()

  return useMutation({
    mutationFn: async (updates: UserSettingsUpdate) => {
      if (!currentUser) throw new Error('No user selected')

      const { data, error } = await supabase
        .from('user_settings')
        .update(updates)
        .eq('user_id', currentUser.id)
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
  const { currentUser } = useUserStore()
  const userId = currentUser?.id

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
    enabled: true,
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
