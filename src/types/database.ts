// Convenience types for the app, derived from the generated Supabase schema.
// Single source of truth = src/integrations/supabase/types.ts (regenerated from
// the live database). This file only re-exports friendly aliases + relation shapes.
import type { Database, Json } from '@/integrations/supabase/types'

export type { Database, Json }

export type IngredientCategory = Database['public']['Enums']['ingredient_category']
export type MealType = Database['public']['Enums']['meal_type']

type Tables = Database['public']['Tables']

export type AppUser = Tables['app_users']['Row']
export type AppUserInsert = Tables['app_users']['Insert']
export type AppUserUpdate = Tables['app_users']['Update']

export type Ingredient = Tables['ingredients']['Row']
export type IngredientInsert = Tables['ingredients']['Insert']
export type IngredientUpdate = Tables['ingredients']['Update']

export type Recipe = Tables['recipes']['Row']
export type RecipeInsert = Tables['recipes']['Insert']
export type RecipeUpdate = Tables['recipes']['Update']

export type RecipeIngredient = Tables['recipe_ingredients']['Row']
export type RecipeIngredientInsert = Tables['recipe_ingredients']['Insert']

export type FoodEntry = Tables['food_entries']['Row']
export type FoodEntryInsert = Tables['food_entries']['Insert']
export type FoodEntryUpdate = Tables['food_entries']['Update']

export type FoodEntryIngredient = Tables['food_entry_ingredients']['Row']
export type FoodEntryIngredientInsert = Tables['food_entry_ingredients']['Insert']

export type UserSettings = Tables['user_settings']['Row']
export type UserSettingsUpdate = Tables['user_settings']['Update']

export type UserStreak = Tables['user_streaks']['Row']

export type Store = Tables['stores']['Row']
export type StoreInsert = Tables['stores']['Insert']
export type StoreUpdate = Tables['stores']['Update']

export type GroceryPurchase = Tables['grocery_purchases']['Row']
export type GroceryPurchaseInsert = Tables['grocery_purchases']['Insert']
export type GroceryPurchaseUpdate = Tables['grocery_purchases']['Update']

export type GroceryInventory = Tables['grocery_inventory']['Row']
export type GroceryInventoryInsert = Tables['grocery_inventory']['Insert']
export type GroceryInventoryUpdate = Tables['grocery_inventory']['Update']

export type ShoppingListItem = Tables['shopping_list']['Row']
export type ShoppingListItemInsert = Tables['shopping_list']['Insert']
export type ShoppingListItemUpdate = Tables['shopping_list']['Update']

// Sharing / household
export type Household = Tables['households']['Row']
export type HouseholdMember = Tables['household_members']['Row']

// Shared inspiration / wishlist board
export type WishlistItem = Tables['wishlist_items']['Row']
export type WishlistItemInsert = Tables['wishlist_items']['Insert']
export type WishlistItemUpdate = Tables['wishlist_items']['Update']

// Body metrics (weight / body composition) — Renpho scaffold
export type BodyMetric = Tables['body_metrics']['Row']
export type BodyMetricInsert = Tables['body_metrics']['Insert']
export type BodyMetricSource = Database['public']['Enums']['body_metric_source']

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

export interface GroceryPurchaseWithDetails extends GroceryPurchase {
  ingredient?: Ingredient | null
  store?: Store | null
}
