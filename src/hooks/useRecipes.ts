import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, getCurrentUserId } from '@/lib/supabase'
import type {
  Recipe,
  RecipeInsert,
  RecipeUpdate,
  RecipeWithIngredients,
  RecipeIngredientInsert,
} from '@/types/database'

const RECIPES_KEY = ['recipes']

export function useRecipes(favoritesOnly?: boolean) {
  return useQuery({
    queryKey: [...RECIPES_KEY, favoritesOnly],
    queryFn: async () => {
      const userId = await getCurrentUserId()

      let query = supabase
        .from('recipes')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (favoritesOnly) {
        query = query.eq('is_favorite', true)
      }

      const { data, error } = await query

      if (error) throw error
      return data as Recipe[]
    },
  })
}

export function useRecipe(id: string) {
  return useQuery({
    queryKey: [...RECIPES_KEY, id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('recipes')
        .select(
          `
          *,
          recipe_ingredients (
            *,
            ingredient:ingredients (*)
          )
        `
        )
        .eq('id', id)
        .single()

      if (error) throw error
      return data as RecipeWithIngredients
    },
    enabled: !!id,
  })
}

interface CreateRecipeInput {
  recipe: Omit<RecipeInsert, 'user_id'>
  ingredients: { ingredientId: string; quantity: number }[]
}

export function useCreateRecipe() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ recipe, ingredients }: CreateRecipeInput) => {
      const userId = await getCurrentUserId()

      // Create the recipe
      const { data: newRecipe, error: recipeError } = await supabase
        .from('recipes')
        .insert({ ...recipe, user_id: userId })
        .select()
        .single()

      if (recipeError) throw recipeError

      // Add ingredients
      if (ingredients.length > 0) {
        const recipeIngredients: RecipeIngredientInsert[] = ingredients.map(
          (ing) => ({
            recipe_id: newRecipe.id,
            ingredient_id: ing.ingredientId,
            quantity: ing.quantity,
          })
        )

        const { error: ingredientsError } = await supabase
          .from('recipe_ingredients')
          .insert(recipeIngredients)

        if (ingredientsError) throw ingredientsError
      }

      return newRecipe as Recipe
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RECIPES_KEY })
    },
  })
}

interface UpdateRecipeInput {
  id: string
  recipe: RecipeUpdate
  ingredients?: { ingredientId: string; quantity: number }[]
}

export function useUpdateRecipe() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, recipe, ingredients }: UpdateRecipeInput) => {
      // Update the recipe
      const { data: updatedRecipe, error: recipeError } = await supabase
        .from('recipes')
        .update(recipe)
        .eq('id', id)
        .select()
        .single()

      if (recipeError) throw recipeError

      // If ingredients are provided, replace them
      if (ingredients) {
        // Delete existing ingredients
        await supabase.from('recipe_ingredients').delete().eq('recipe_id', id)

        // Add new ingredients
        if (ingredients.length > 0) {
          const recipeIngredients: RecipeIngredientInsert[] = ingredients.map(
            (ing) => ({
              recipe_id: id,
              ingredient_id: ing.ingredientId,
              quantity: ing.quantity,
            })
          )

          const { error: ingredientsError } = await supabase
            .from('recipe_ingredients')
            .insert(recipeIngredients)

          if (ingredientsError) throw ingredientsError
        }
      }

      return updatedRecipe as Recipe
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: RECIPES_KEY })
      queryClient.invalidateQueries({ queryKey: [...RECIPES_KEY, variables.id] })
    },
  })
}

export function useDeleteRecipe() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('recipes').delete().eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RECIPES_KEY })
    },
  })
}

export function useToggleFavorite() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, isFavorite }: { id: string; isFavorite: boolean }) => {
      const { error } = await supabase
        .from('recipes')
        .update({ is_favorite: isFavorite })
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RECIPES_KEY })
    },
  })
}

export function useSearchRecipes(search: string) {
  return useQuery({
    queryKey: [...RECIPES_KEY, 'search', search],
    queryFn: async () => {
      const userId = await getCurrentUserId()

      const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .eq('user_id', userId)
        .ilike('name', `%${search}%`)
        .order('name')
        .limit(20)

      if (error) throw error
      return data as Recipe[]
    },
    enabled: search.length >= 2,
  })
}
