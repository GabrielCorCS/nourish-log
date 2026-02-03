import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import type {
  Ingredient,
  IngredientInsert,
  IngredientUpdate,
  IngredientCategory,
} from '@/types/database'

const INGREDIENTS_KEY = ['ingredients']

export function useIngredients(category?: IngredientCategory | 'all') {
  const { user } = useAuth()
  const userId = user?.id

  return useQuery({
    queryKey: [...INGREDIENTS_KEY, userId, category],
    queryFn: async () => {
      let query = supabase
        .from('ingredients')
        .select('*')
        .order('name')

      // RLS will filter - just select all accessible
      if (category && category !== 'all') {
        query = query.eq('category', category)
      }

      const { data, error } = await query

      if (error) throw error
      return data as Ingredient[]
    },
    enabled: true,
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
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (ingredient: Omit<IngredientInsert, 'user_id'>) => {
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('ingredients')
        .insert({ ...ingredient, user_id: user.id })
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
  const { user } = useAuth()
  const userId = user?.id

  return useQuery({
    queryKey: [...INGREDIENTS_KEY, 'search', userId, search],
    queryFn: async () => {
      const query = supabase
        .from('ingredients')
        .select('*')
        .ilike('name', `%${search}%`)
        .order('name')
        .limit(20)

      const { data, error } = await query

      if (error) throw error
      return data as Ingredient[]
    },
    enabled: search.length >= 2,
  })
}
