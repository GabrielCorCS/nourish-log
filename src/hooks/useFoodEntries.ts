import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { useViewStore } from '@/stores/viewStore'
import { getDayRange, toISODateString } from '@/lib/dates'
import type { AmountUnit } from '@/lib/nutrition'
import type {
  FoodEntry,
  FoodEntryInsert,
  FoodEntryUpdate,
  FoodEntryWithDetails,
  FoodEntryIngredientInsert,
} from '@/types/database'

const FOOD_ENTRIES_KEY = ['food-entries']

// Personal logs are now visible household-wide (RLS), so queries MUST scope to a
// subject user_id. Pass `targetUserId` to read the partner's day (proxy/partner views).
export function useFoodEntriesByDate(date: Date, targetUserId?: string) {
  const { user } = useAuth()
  const viewUserId = useViewStore((s) => s.viewUserId)
  // Explicit target (e.g. partner card) wins; otherwise follow the global view toggle.
  const subjectId = targetUserId ?? viewUserId ?? user?.id
  const dateStr = toISODateString(date)

  return useQuery({
    queryKey: [...FOOD_ENTRIES_KEY, subjectId, dateStr],
    queryFn: async () => {
      if (!subjectId) return []

      const { start, end } = getDayRange(date)

      const { data, error } = await supabase
        .from('food_entries')
        .select(
          `
          *,
          recipe:recipes (*),
          food_entry_ingredients (
            *,
            ingredient:ingredients (*)
          )
        `
        )
        .eq('user_id', subjectId)
        .gte('logged_at', start)
        .lte('logged_at', end)
        .order('logged_at', { ascending: true })

      if (error) throw error
      return data as FoodEntryWithDetails[]
    },
    enabled: !!subjectId,
  })
}

export function useTodayEntries() {
  return useFoodEntriesByDate(new Date())
}

export function useWeeklyEntries(startDate: Date, endDate: Date) {
  const { user } = useAuth()
  const viewUserId = useViewStore((s) => s.viewUserId)
  const userId = viewUserId ?? user?.id

  return useQuery({
    queryKey: [
      ...FOOD_ENTRIES_KEY,
      'weekly',
      userId,
      toISODateString(startDate),
      toISODateString(endDate),
    ],
    queryFn: async () => {
      if (!userId) return []

      const { start } = getDayRange(startDate)
      const { end } = getDayRange(endDate)

      const { data, error } = await supabase
        .from('food_entries')
        .select('*')
        .eq('user_id', userId)
        .gte('logged_at', start)
        .lte('logged_at', end)
        .order('logged_at', { ascending: true })

      if (error) throw error
      return data as FoodEntry[]
    },
    enabled: !!userId,
  })
}

interface CreateFoodEntryInput {
  entry: Omit<FoodEntryInsert, 'user_id'>
  // amount+unit drive the new scaling model; quantity (servings-equivalent) is
  // kept for back-compat with the recipe trigger and older reads.
  ingredients?: { ingredientId: string; amount: number; unit: AmountUnit; quantity: number }[]
  // For proxy logging: whose log this belongs to (defaults to the current user).
  subjectUserId?: string
}

export function useCreateFoodEntry() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async ({ entry, ingredients, subjectUserId }: CreateFoodEntryInput) => {
      if (!user) throw new Error('Not authenticated')

      const { data: newEntry, error: entryError } = await supabase
        .from('food_entries')
        .insert({ ...entry, user_id: subjectUserId ?? user.id, logged_by: user.id })
        .select()
        .single()

      if (entryError) throw entryError

      if (ingredients && ingredients.length > 0) {
        const entryIngredients: FoodEntryIngredientInsert[] = ingredients.map(
          (ing) => ({
            food_entry_id: newEntry.id,
            ingredient_id: ing.ingredientId,
            amount: ing.amount,
            unit: ing.unit,
            quantity: ing.quantity,
          })
        )

        const { error: ingredientsError } = await supabase
          .from('food_entry_ingredients')
          .insert(entryIngredients)

        if (ingredientsError) throw ingredientsError
      }

      return newEntry as FoodEntry
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FOOD_ENTRIES_KEY })
    },
  })
}

export function useUpdateFoodEntry() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...updates }: FoodEntryUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('food_entries')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as FoodEntry
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FOOD_ENTRIES_KEY })
    },
  })
}

export function useDeleteFoodEntry() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('food_entries').delete().eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FOOD_ENTRIES_KEY })
    },
  })
}

export function calculateDailyTotals(entries: FoodEntry[]) {
  return entries.reduce(
    (totals, entry) => ({
      calories: totals.calories + entry.calories,
      protein: totals.protein + entry.protein,
      carbs: totals.carbs + entry.carbs,
      fat: totals.fat + entry.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  )
}
