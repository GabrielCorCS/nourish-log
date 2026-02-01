// Re-export types from the auto-generated Supabase types
import type { Database as SupabaseDatabase } from '@/integrations/supabase/types'

export type Database = SupabaseDatabase

// Enums
export type IngredientCategory = SupabaseDatabase['public']['Enums']['ingredient_category']
export type MealType = SupabaseDatabase['public']['Enums']['meal_type']

// Table Row types
export type Ingredient = SupabaseDatabase['public']['Tables']['ingredients']['Row']
export type IngredientInsert = SupabaseDatabase['public']['Tables']['ingredients']['Insert']
export type IngredientUpdate = SupabaseDatabase['public']['Tables']['ingredients']['Update']

export type Recipe = SupabaseDatabase['public']['Tables']['recipes']['Row']
export type RecipeInsert = SupabaseDatabase['public']['Tables']['recipes']['Insert']
export type RecipeUpdate = SupabaseDatabase['public']['Tables']['recipes']['Update']

export type RecipeIngredient = SupabaseDatabase['public']['Tables']['recipe_ingredients']['Row']
export type RecipeIngredientInsert = SupabaseDatabase['public']['Tables']['recipe_ingredients']['Insert']

export type FoodEntry = SupabaseDatabase['public']['Tables']['food_entries']['Row']
export type FoodEntryInsert = SupabaseDatabase['public']['Tables']['food_entries']['Insert']
export type FoodEntryUpdate = SupabaseDatabase['public']['Tables']['food_entries']['Update']

export type FoodEntryIngredient = SupabaseDatabase['public']['Tables']['food_entry_ingredients']['Row']
export type FoodEntryIngredientInsert = SupabaseDatabase['public']['Tables']['food_entry_ingredients']['Insert']

export type UserSettings = SupabaseDatabase['public']['Tables']['user_settings']['Row']
export type UserSettingsUpdate = SupabaseDatabase['public']['Tables']['user_settings']['Update']

export type UserStreak = SupabaseDatabase['public']['Tables']['user_streaks']['Row']

// Extended types with relations
export interface RecipeWithIngredients extends Recipe {
  recipe_ingredients: (RecipeIngredient & {
    ingredient: Ingredient
  })[]
}

export interface FoodEntryWithDetails extends FoodEntry {
  recipe?: Recipe | null
  food_entry_ingredients?: (FoodEntryIngredient & {
    ingredient: Ingredient
  })[]
}
