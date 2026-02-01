import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, getCurrentUserId } from '@/lib/supabase'
import type {
  Recipe,
  RecipeWithIngredients,
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
  recipe: {
    name: string
    emoji?: string | null
    description?: string | null
    instructions?: string | null
    servings?: number
    prep_time?: number | null
    cook_time?: number | null
    total_calories?: number
    total_protein?: number
    total_carbs?: number
    total_fat?: number
    is_favorite?: boolean
  }
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
        .insert({
          user_id: userId,
          name: recipe.name,
          emoji: recipe.emoji,
          description: recipe.description,
          instructions: recipe.instructions,
          servings: recipe.servings ?? 1,
          prep_time: recipe.prep_time,
          cook_time: recipe.cook_time,
          total_calories: recipe.total_calories ?? 0,
          total_protein: recipe.total_protein ?? 0,
          total_carbs: recipe.total_carbs ?? 0,
          total_fat: recipe.total_fat ?? 0,
          is_favorite: recipe.is_favorite ?? false,
        })
        .select()
        .single()

      if (recipeError) throw recipeError

      // Add ingredients
      if (ingredients.length > 0) {
        const recipeIngredients = ingredients.map((ing) => ({
          recipe_id: newRecipe.id,
          ingredient_id: ing.ingredientId,
          quantity: ing.quantity,
        }))

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
  recipe: {
    name?: string
    emoji?: string | null
    description?: string | null
    instructions?: string | null
    servings?: number
    prep_time?: number | null
    cook_time?: number | null
    total_calories?: number
    total_protein?: number
    total_carbs?: number
    total_fat?: number
    is_favorite?: boolean
  }
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
          const recipeIngredients = ingredients.map((ing) => ({
            recipe_id: id,
            ingredient_id: ing.ingredientId,
            quantity: ing.quantity,
          }))

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
