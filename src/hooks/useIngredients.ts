import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, getCurrentUserId } from '@/lib/supabase'
import type {
  Ingredient,
  IngredientInsert,
  IngredientUpdate,
  IngredientCategory,
} from '@/types/database'

const INGREDIENTS_KEY = ['ingredients']

export function useIngredients(category?: IngredientCategory | 'all') {
  return useQuery({
    queryKey: [...INGREDIENTS_KEY, category],
    queryFn: async () => {
      const userId = await getCurrentUserId()

      let query = supabase
        .from('ingredients')
        .select('*')
        .or(`user_id.eq.${userId},is_default.eq.true`)
        .order('name')

      if (category && category !== 'all') {
        query = query.eq('category', category)
      }

      const { data, error } = await query

      if (error) throw error
      return data as Ingredient[]
    },
  })
}

export function useIngredient(id: string) {
  return useQuery({
    queryKey: [...INGREDIENTS_KEY, id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ingredients')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      return data as Ingredient
    },
    enabled: !!id,
  })
}

export function useCreateIngredient() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (ingredient: Omit<IngredientInsert, 'user_id'>) => {
      const userId = await getCurrentUserId()

      const { data, error } = await supabase
        .from('ingredients')
        .insert({ ...ingredient, user_id: userId })
        .select()
        .single()

      if (error) throw error
      return data as Ingredient
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INGREDIENTS_KEY })
    },
  })
}

export function useUpdateIngredient() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: IngredientUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('ingredients')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as Ingredient
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INGREDIENTS_KEY })
    },
  })
}

export function useDeleteIngredient() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('ingredients').delete().eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INGREDIENTS_KEY })
    },
  })
}

export function useSearchIngredients(search: string) {
  return useQuery({
    queryKey: [...INGREDIENTS_KEY, 'search', search],
    queryFn: async () => {
      const userId = await getCurrentUserId()

      const { data, error } = await supabase
        .from('ingredients')
        .select('*')
        .or(`user_id.eq.${userId},is_default.eq.true`)
        .ilike('name', `%${search}%`)
        .order('name')
        .limit(20)

      if (error) throw error
      return data as Ingredient[]
    },
    enabled: search.length >= 2,
  })
}
