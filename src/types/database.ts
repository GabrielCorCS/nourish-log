export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type IngredientCategory =
  | 'proteins'
  | 'grains'
  | 'vegetables'
  | 'fruits'
  | 'dairy'
  | 'fats'
  | 'legumes'
  | 'nuts'
  | 'condiments'
  | 'beverages'

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack'

export interface Database {
  public: {
    Tables: {
      app_users: {
        Row: {
          id: string
          email: string
          name: string
          avatar_emoji: string | null
          is_admin: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          name: string
          avatar_emoji?: string | null
          is_admin?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          avatar_emoji?: string | null
          is_admin?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      ingredients: {
        Row: {
          id: string
          user_id: string | null
          name: string
          emoji: string | null
          category: IngredientCategory
          serving_size: number
          serving_unit: string
          calories: number
          protein: number
          carbs: number
          fat: number
          is_default: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          name: string
          emoji?: string | null
          category: IngredientCategory
          serving_size: number
          serving_unit: string
          calories: number
          protein: number
          carbs: number
          fat: number
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          name?: string
          emoji?: string | null
          category?: IngredientCategory
          serving_size?: number
          serving_unit?: string
          calories?: number
          protein?: number
          carbs?: number
          fat?: number
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      recipes: {
        Row: {
          id: string
          user_id: string
          name: string
          emoji: string | null
          description: string | null
          instructions: string | null
          servings: number
          prep_time: number | null
          cook_time: number | null
          total_calories: number
          total_protein: number
          total_carbs: number
          total_fat: number
          is_favorite: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
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
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
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
          created_at?: string
          updated_at?: string
        }
      }
      recipe_ingredients: {
        Row: {
          id: string
          recipe_id: string
          ingredient_id: string
          quantity: number
          created_at: string
        }
        Insert: {
          id?: string
          recipe_id: string
          ingredient_id: string
          quantity: number
          created_at?: string
        }
        Update: {
          id?: string
          recipe_id?: string
          ingredient_id?: string
          quantity?: number
          created_at?: string
        }
      }
      food_entries: {
        Row: {
          id: string
          user_id: string
          recipe_id: string | null
          meal_type: MealType
          servings: number
          calories: number
          protein: number
          carbs: number
          fat: number
          notes: string | null
          logged_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          recipe_id?: string | null
          meal_type: MealType
          servings?: number
          calories: number
          protein: number
          carbs: number
          fat: number
          notes?: string | null
          logged_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          recipe_id?: string | null
          meal_type?: MealType
          servings?: number
          calories?: number
          protein?: number
          carbs?: number
          fat?: number
          notes?: string | null
          logged_at?: string
          created_at?: string
          updated_at?: string
        }
      }
      food_entry_ingredients: {
        Row: {
          id: string
          food_entry_id: string
          ingredient_id: string
          quantity: number
          created_at: string
        }
        Insert: {
          id?: string
          food_entry_id: string
          ingredient_id: string
          quantity: number
          created_at?: string
        }
        Update: {
          id?: string
          food_entry_id?: string
          ingredient_id?: string
          quantity?: number
          created_at?: string
        }
      }
      user_settings: {
        Row: {
          id: string
          user_id: string
          daily_calorie_goal: number
          daily_protein_goal: number
          daily_carbs_goal: number
          daily_fat_goal: number
          theme: string
          notifications_enabled: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          daily_calorie_goal?: number
          daily_protein_goal?: number
          daily_carbs_goal?: number
          daily_fat_goal?: number
          theme?: string
          notifications_enabled?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          daily_calorie_goal?: number
          daily_protein_goal?: number
          daily_carbs_goal?: number
          daily_fat_goal?: number
          theme?: string
          notifications_enabled?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      user_streaks: {
        Row: {
          id: string
          user_id: string
          current_streak: number
          longest_streak: number
          last_logged_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          current_streak?: number
          longest_streak?: number
          last_logged_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          current_streak?: number
          longest_streak?: number
          last_logged_date?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}

// Convenience types
export type AppUser = Database['public']['Tables']['app_users']['Row']
export type AppUserInsert = Database['public']['Tables']['app_users']['Insert']
export type AppUserUpdate = Database['public']['Tables']['app_users']['Update']

export type Ingredient = Database['public']['Tables']['ingredients']['Row']
export type IngredientInsert = Database['public']['Tables']['ingredients']['Insert']
export type IngredientUpdate = Database['public']['Tables']['ingredients']['Update']

export type Recipe = Database['public']['Tables']['recipes']['Row']
export type RecipeInsert = Database['public']['Tables']['recipes']['Insert']
export type RecipeUpdate = Database['public']['Tables']['recipes']['Update']

export type RecipeIngredient = Database['public']['Tables']['recipe_ingredients']['Row']
export type RecipeIngredientInsert = Database['public']['Tables']['recipe_ingredients']['Insert']

export type FoodEntry = Database['public']['Tables']['food_entries']['Row']
export type FoodEntryInsert = Database['public']['Tables']['food_entries']['Insert']
export type FoodEntryUpdate = Database['public']['Tables']['food_entries']['Update']

export type FoodEntryIngredient = Database['public']['Tables']['food_entry_ingredients']['Row']
export type FoodEntryIngredientInsert = Database['public']['Tables']['food_entry_ingredients']['Insert']

export type UserSettings = Database['public']['Tables']['user_settings']['Row']
export type UserSettingsUpdate = Database['public']['Tables']['user_settings']['Update']

export type UserStreak = Database['public']['Tables']['user_streaks']['Row']

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
