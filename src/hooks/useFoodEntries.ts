import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, getCurrentUserId } from '@/lib/supabase'
import { getDayRange, toISODateString } from '@/lib/dates'
import type {
  FoodEntry,
  FoodEntryWithDetails,
  MealType,
} from '@/types/database'

const FOOD_ENTRIES_KEY = ['food-entries']

export function useFoodEntriesByDate(date: Date) {
  const dateStr = toISODateString(date)

  return useQuery({
    queryKey: [...FOOD_ENTRIES_KEY, dateStr],
    queryFn: async () => {
      const userId = await getCurrentUserId()
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
        .eq('user_id', userId)
        .gte('logged_at', start)
        .lte('logged_at', end)
        .order('logged_at', { ascending: true })

      if (error) throw error
      return data as FoodEntryWithDetails[]
    },
  })
}

export function useTodayEntries() {
  return useFoodEntriesByDate(new Date())
}

export function useWeeklyEntries(startDate: Date, endDate: Date) {
  return useQuery({
    queryKey: [
      ...FOOD_ENTRIES_KEY,
      'weekly',
      toISODateString(startDate),
      toISODateString(endDate),
    ],
    queryFn: async () => {
      const userId = await getCurrentUserId()
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
  })
}

interface CreateFoodEntryInput {
  entry: {
    meal_type: MealType
    recipe_id?: string | null
    servings?: number
    calories: number
    protein: number
    carbs: number
    fat: number
    notes?: string | null
    logged_at?: string
  }
  ingredients?: { ingredientId: string; quantity: number }[]
}

export function useCreateFoodEntry() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ entry, ingredients }: CreateFoodEntryInput) => {
      const userId = await getCurrentUserId()

      // Create the food entry
      const { data: newEntry, error: entryError } = await supabase
        .from('food_entries')
        .insert({
          user_id: userId,
          meal_type: entry.meal_type,
          recipe_id: entry.recipe_id,
          servings: entry.servings ?? 1,
          calories: entry.calories,
          protein: entry.protein,
          carbs: entry.carbs,
          fat: entry.fat,
          notes: entry.notes,
          logged_at: entry.logged_at,
        })
        .select()
        .single()

      if (entryError) throw entryError

      // Add ingredients if quick-add
      if (ingredients && ingredients.length > 0) {
        const entryIngredients = ingredients.map((ing) => ({
          food_entry_id: newEntry.id,
          ingredient_id: ing.ingredientId,
          quantity: ing.quantity,
        }))

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
    mutationFn: async ({
      id,
      ...updates
    }: {
      id: string
      meal_type?: MealType
      servings?: number
      calories?: number
      protein?: number
      carbs?: number
      fat?: number
      notes?: string | null
    }) => {
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

// Calculate daily totals from entries
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
