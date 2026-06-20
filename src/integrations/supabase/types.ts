export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      app_users: {
        Row: {
          avatar_emoji: string | null
          created_at: string
          email: string
          id: string
          is_admin: boolean
          name: string
          updated_at: string
        }
        Insert: {
          avatar_emoji?: string | null
          created_at?: string
          email: string
          id?: string
          is_admin?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          avatar_emoji?: string | null
          created_at?: string
          email?: string
          id?: string
          is_admin?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      food_entries: {
        Row: {
          calories: number
          carbs: number
          created_at: string
          fat: number
          id: string
          logged_at: string
          logged_by: string | null
          meal_type: Database["public"]["Enums"]["meal_type"]
          notes: string | null
          protein: number
          recipe_id: string | null
          servings: number
          updated_at: string
          user_id: string
        }
        Insert: {
          calories?: number
          carbs?: number
          created_at?: string
          fat?: number
          id?: string
          logged_at?: string
          logged_by?: string | null
          meal_type: Database["public"]["Enums"]["meal_type"]
          notes?: string | null
          protein?: number
          recipe_id?: string | null
          servings?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          calories?: number
          carbs?: number
          created_at?: string
          fat?: number
          id?: string
          logged_at?: string
          logged_by?: string | null
          meal_type?: Database["public"]["Enums"]["meal_type"]
          notes?: string | null
          protein?: number
          recipe_id?: string | null
          servings?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "food_entries_logged_by_fkey"
            columns: ["logged_by"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "food_entries_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "food_entries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
        ]
      }
      food_entry_ingredients: {
        Row: {
          amount: number | null
          created_at: string
          food_entry_id: string
          id: string
          ingredient_id: string
          quantity: number
          unit: string
        }
        Insert: {
          amount?: number | null
          created_at?: string
          food_entry_id: string
          id?: string
          ingredient_id: string
          quantity?: number
          unit?: string
        }
        Update: {
          amount?: number | null
          created_at?: string
          food_entry_id?: string
          id?: string
          ingredient_id?: string
          quantity?: number
          unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "food_entry_ingredients_food_entry_id_fkey"
            columns: ["food_entry_id"]
            isOneToOne: false
            referencedRelation: "food_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "food_entry_ingredients_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients"
            referencedColumns: ["id"]
          },
        ]
      }
      grocery_inventory: {
        Row: {
          created_at: string
          household_id: string | null
          id: string
          ingredient_id: string
          quantity_on_hand: number
          threshold_quantity: number
          unit: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          household_id?: string | null
          id?: string
          ingredient_id: string
          quantity_on_hand?: number
          threshold_quantity?: number
          unit?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          household_id?: string | null
          id?: string
          ingredient_id?: string
          quantity_on_hand?: number
          threshold_quantity?: number
          unit?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "grocery_inventory_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grocery_inventory_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients"
            referencedColumns: ["id"]
          },
        ]
      }
      grocery_purchases: {
        Row: {
          created_at: string
          household_id: string | null
          id: string
          ingredient_id: string | null
          notes: string | null
          price: number
          purchased_at: string
          quantity: number
          store_id: string | null
          unit: string
          user_id: string
        }
        Insert: {
          created_at?: string
          household_id?: string | null
          id?: string
          ingredient_id?: string | null
          notes?: string | null
          price?: number
          purchased_at?: string
          quantity?: number
          store_id?: string | null
          unit?: string
          user_id: string
        }
        Update: {
          created_at?: string
          household_id?: string | null
          id?: string
          ingredient_id?: string | null
          notes?: string | null
          price?: number
          purchased_at?: string
          quantity?: number
          store_id?: string | null
          unit?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "grocery_purchases_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grocery_purchases_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grocery_purchases_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      household_members: {
        Row: {
          created_at: string
          household_id: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          household_id: string
          id?: string
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string
          household_id?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "household_members_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "household_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
        ]
      }
      households: {
        Row: {
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      ingredients: {
        Row: {
          barcode: string | null
          brand: string | null
          calories: number
          carbs: number
          category: Database["public"]["Enums"]["ingredient_category"]
          created_at: string
          default_store_id: string | null
          emoji: string | null
          fat: number
          household_id: string | null
          id: string
          image_url: string | null
          is_default: boolean
          name: string
          off_id: string | null
          protein: number
          serving_grams: number | null
          serving_size: number
          serving_unit: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          barcode?: string | null
          brand?: string | null
          calories?: number
          carbs?: number
          category: Database["public"]["Enums"]["ingredient_category"]
          created_at?: string
          default_store_id?: string | null
          emoji?: string | null
          fat?: number
          household_id?: string | null
          id?: string
          image_url?: string | null
          is_default?: boolean
          name: string
          off_id?: string | null
          protein?: number
          serving_grams?: number | null
          serving_size?: number
          serving_unit?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          barcode?: string | null
          brand?: string | null
          calories?: number
          carbs?: number
          category?: Database["public"]["Enums"]["ingredient_category"]
          created_at?: string
          default_store_id?: string | null
          emoji?: string | null
          fat?: number
          household_id?: string | null
          id?: string
          image_url?: string | null
          is_default?: boolean
          name?: string
          off_id?: string | null
          protein?: number
          serving_grams?: number | null
          serving_size?: number
          serving_unit?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ingredients_default_store_id_fkey"
            columns: ["default_store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ingredients_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ingredients_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
        ]
      }
      invited_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          invited_by: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          invited_by?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          invited_by?: string | null
        }
        Relationships: []
      }
      recipe_ingredients: {
        Row: {
          amount: number | null
          created_at: string
          id: string
          ingredient_id: string
          quantity: number
          recipe_id: string
          unit: string
        }
        Insert: {
          amount?: number | null
          created_at?: string
          id?: string
          ingredient_id: string
          quantity?: number
          recipe_id: string
          unit?: string
        }
        Update: {
          amount?: number | null
          created_at?: string
          id?: string
          ingredient_id?: string
          quantity?: number
          recipe_id?: string
          unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipe_ingredients_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_ingredients_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      recipes: {
        Row: {
          cook_time: number | null
          created_at: string
          description: string | null
          emoji: string | null
          household_id: string | null
          id: string
          instructions: string | null
          is_favorite: boolean
          name: string
          prep_time: number | null
          servings: number
          total_calories: number
          total_carbs: number
          total_fat: number
          total_protein: number
          updated_at: string
          user_id: string
        }
        Insert: {
          cook_time?: number | null
          created_at?: string
          description?: string | null
          emoji?: string | null
          household_id?: string | null
          id?: string
          instructions?: string | null
          is_favorite?: boolean
          name: string
          prep_time?: number | null
          servings?: number
          total_calories?: number
          total_carbs?: number
          total_fat?: number
          total_protein?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          cook_time?: number | null
          created_at?: string
          description?: string | null
          emoji?: string | null
          household_id?: string | null
          id?: string
          instructions?: string | null
          is_favorite?: boolean
          name?: string
          prep_time?: number | null
          servings?: number
          total_calories?: number
          total_carbs?: number
          total_fat?: number
          total_protein?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipes_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
        ]
      }
      shopping_list: {
        Row: {
          auto_added: boolean
          created_at: string
          household_id: string | null
          id: string
          ingredient_id: string
          is_purchased: boolean
          quantity_needed: number
          user_id: string
        }
        Insert: {
          auto_added?: boolean
          created_at?: string
          household_id?: string | null
          id?: string
          ingredient_id: string
          is_purchased?: boolean
          quantity_needed?: number
          user_id: string
        }
        Update: {
          auto_added?: boolean
          created_at?: string
          household_id?: string | null
          id?: string
          ingredient_id?: string
          is_purchased?: boolean
          quantity_needed?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shopping_list_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shopping_list_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients"
            referencedColumns: ["id"]
          },
        ]
      }
      stores: {
        Row: {
          created_at: string
          emoji: string | null
          household_id: string | null
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          emoji?: string | null
          household_id?: string | null
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          emoji?: string | null
          household_id?: string | null
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stores_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          created_at: string
          daily_calorie_goal: number
          daily_carbs_goal: number
          daily_fat_goal: number
          daily_protein_goal: number
          id: string
          notifications_enabled: boolean
          theme: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          daily_calorie_goal?: number
          daily_carbs_goal?: number
          daily_fat_goal?: number
          daily_protein_goal?: number
          id?: string
          notifications_enabled?: boolean
          theme?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          daily_calorie_goal?: number
          daily_carbs_goal?: number
          daily_fat_goal?: number
          daily_protein_goal?: number
          id?: string
          notifications_enabled?: boolean
          theme?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_streaks: {
        Row: {
          created_at: string
          current_streak: number
          id: string
          last_logged_date: string | null
          longest_streak: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_streak?: number
          id?: string
          last_logged_date?: string | null
          longest_streak?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_streak?: number
          id?: string
          last_logged_date?: string | null
          longest_streak?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_streaks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
        ]
      }
      wishlist_items: {
        Row: {
          created_at: string
          created_by: string | null
          household_id: string
          id: string
          image_url: string | null
          ingredient_id: string | null
          is_done: boolean
          note: string | null
          recipe_id: string | null
          title: string
          updated_at: string
          url: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          household_id: string
          id?: string
          image_url?: string | null
          ingredient_id?: string | null
          is_done?: boolean
          note?: string | null
          recipe_id?: string | null
          title: string
          updated_at?: string
          url?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          household_id?: string
          id?: string
          image_url?: string | null
          ingredient_id?: string | null
          is_done?: boolean
          note?: string | null
          recipe_id?: string | null
          title?: string
          updated_at?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wishlist_items_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wishlist_items_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wishlist_items_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wishlist_items_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_household_member_by_email: {
        Args: { _email: string }
        Returns: undefined
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      household_id_for: { Args: { _user_id: string }; Returns: string }
      is_email_invited: { Args: { _email: string }; Returns: boolean }
      is_my_household: { Args: { _household_id: string }; Returns: boolean }
      my_household_id: { Args: never; Returns: string }
      same_household: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "user"
      ingredient_category:
        | "proteins"
        | "grains"
        | "vegetables"
        | "fruits"
        | "dairy"
        | "fats"
        | "legumes"
        | "nuts"
        | "condiments"
        | "beverages"
      meal_type: "breakfast" | "lunch" | "dinner" | "snack"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
      ingredient_category: [
        "proteins",
        "grains",
        "vegetables",
        "fruits",
        "dairy",
        "fats",
        "legumes",
        "nuts",
        "condiments",
        "beverages",
      ],
      meal_type: ["breakfast", "lunch", "dinner", "snack"],
    },
  },
} as const
