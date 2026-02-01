-- NourishLog Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- INGREDIENT CATEGORIES ENUM
-- ============================================
CREATE TYPE ingredient_category AS ENUM (
  'proteins',
  'grains',
  'vegetables',
  'fruits',
  'dairy',
  'fats',
  'legumes',
  'nuts',
  'condiments',
  'beverages'
);

-- ============================================
-- MEAL TYPE ENUM
-- ============================================
CREATE TYPE meal_type AS ENUM (
  'breakfast',
  'lunch',
  'dinner',
  'snack'
);

-- ============================================
-- INGREDIENTS TABLE
-- ============================================
CREATE TABLE ingredients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  emoji TEXT,
  category ingredient_category NOT NULL,
  serving_size DECIMAL(10,2) NOT NULL DEFAULT 100,
  serving_unit TEXT NOT NULL DEFAULT 'g',
  calories DECIMAL(10,2) NOT NULL DEFAULT 0,
  protein DECIMAL(10,2) NOT NULL DEFAULT 0,
  carbs DECIMAL(10,2) NOT NULL DEFAULT 0,
  fat DECIMAL(10,2) NOT NULL DEFAULT 0,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX idx_ingredients_user_id ON ingredients(user_id);
CREATE INDEX idx_ingredients_category ON ingredients(category);
CREATE INDEX idx_ingredients_name ON ingredients(name);

-- ============================================
-- RECIPES TABLE
-- ============================================
CREATE TABLE recipes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  emoji TEXT,
  description TEXT,
  instructions TEXT,
  servings INTEGER NOT NULL DEFAULT 1,
  prep_time INTEGER, -- in minutes
  cook_time INTEGER, -- in minutes
  total_calories DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_protein DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_carbs DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_fat DECIMAL(10,2) NOT NULL DEFAULT 0,
  is_favorite BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX idx_recipes_user_id ON recipes(user_id);
CREATE INDEX idx_recipes_is_favorite ON recipes(is_favorite);

-- ============================================
-- RECIPE INGREDIENTS (Junction Table)
-- ============================================
CREATE TABLE recipe_ingredients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  ingredient_id UUID NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
  quantity DECIMAL(10,2) NOT NULL DEFAULT 1, -- number of servings of the ingredient
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(recipe_id, ingredient_id)
);

-- Index for faster queries
CREATE INDEX idx_recipe_ingredients_recipe_id ON recipe_ingredients(recipe_id);
CREATE INDEX idx_recipe_ingredients_ingredient_id ON recipe_ingredients(ingredient_id);

-- ============================================
-- FOOD ENTRIES TABLE
-- ============================================
CREATE TABLE food_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipe_id UUID REFERENCES recipes(id) ON DELETE SET NULL,
  meal_type meal_type NOT NULL,
  servings DECIMAL(10,2) NOT NULL DEFAULT 1,
  calories DECIMAL(10,2) NOT NULL DEFAULT 0,
  protein DECIMAL(10,2) NOT NULL DEFAULT 0,
  carbs DECIMAL(10,2) NOT NULL DEFAULT 0,
  fat DECIMAL(10,2) NOT NULL DEFAULT 0,
  notes TEXT,
  logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX idx_food_entries_user_id ON food_entries(user_id);
CREATE INDEX idx_food_entries_logged_at ON food_entries(logged_at);
CREATE INDEX idx_food_entries_meal_type ON food_entries(meal_type);

-- ============================================
-- FOOD ENTRY INGREDIENTS (for quick-add)
-- ============================================
CREATE TABLE food_entry_ingredients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  food_entry_id UUID NOT NULL REFERENCES food_entries(id) ON DELETE CASCADE,
  ingredient_id UUID NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
  quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(food_entry_id, ingredient_id)
);

-- Index for faster queries
CREATE INDEX idx_food_entry_ingredients_entry_id ON food_entry_ingredients(food_entry_id);

-- ============================================
-- USER SETTINGS TABLE
-- ============================================
CREATE TABLE user_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  daily_calorie_goal INTEGER NOT NULL DEFAULT 2000,
  daily_protein_goal INTEGER NOT NULL DEFAULT 150,
  daily_carbs_goal INTEGER NOT NULL DEFAULT 250,
  daily_fat_goal INTEGER NOT NULL DEFAULT 65,
  theme TEXT NOT NULL DEFAULT 'light',
  notifications_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- USER STREAKS TABLE
-- ============================================
CREATE TABLE user_streaks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_logged_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER update_ingredients_updated_at
  BEFORE UPDATE ON ingredients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_recipes_updated_at
  BEFORE UPDATE ON recipes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_food_entries_updated_at
  BEFORE UPDATE ON food_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_user_streaks_updated_at
  BEFORE UPDATE ON user_streaks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- RECIPE NUTRITION CALCULATION TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION calculate_recipe_nutrition()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE recipes
  SET
    total_calories = (
      SELECT COALESCE(SUM(i.calories * ri.quantity), 0)
      FROM recipe_ingredients ri
      JOIN ingredients i ON i.id = ri.ingredient_id
      WHERE ri.recipe_id = COALESCE(NEW.recipe_id, OLD.recipe_id)
    ),
    total_protein = (
      SELECT COALESCE(SUM(i.protein * ri.quantity), 0)
      FROM recipe_ingredients ri
      JOIN ingredients i ON i.id = ri.ingredient_id
      WHERE ri.recipe_id = COALESCE(NEW.recipe_id, OLD.recipe_id)
    ),
    total_carbs = (
      SELECT COALESCE(SUM(i.carbs * ri.quantity), 0)
      FROM recipe_ingredients ri
      JOIN ingredients i ON i.id = ri.ingredient_id
      WHERE ri.recipe_id = COALESCE(NEW.recipe_id, OLD.recipe_id)
    ),
    total_fat = (
      SELECT COALESCE(SUM(i.fat * ri.quantity), 0)
      FROM recipe_ingredients ri
      JOIN ingredients i ON i.id = ri.ingredient_id
      WHERE ri.recipe_id = COALESCE(NEW.recipe_id, OLD.recipe_id)
    )
  WHERE id = COALESCE(NEW.recipe_id, OLD.recipe_id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_recipe_nutrition
  AFTER INSERT OR UPDATE OR DELETE ON recipe_ingredients
  FOR EACH ROW EXECUTE FUNCTION calculate_recipe_nutrition();

-- ============================================
-- STREAK UPDATE TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION update_user_streak()
RETURNS TRIGGER AS $$
DECLARE
  logged_date DATE;
  last_date DATE;
  current_str INTEGER;
  longest_str INTEGER;
BEGIN
  logged_date := DATE(NEW.logged_at);

  SELECT last_logged_date, current_streak, longest_streak
  INTO last_date, current_str, longest_str
  FROM user_streaks
  WHERE user_id = NEW.user_id;

  IF NOT FOUND THEN
    INSERT INTO user_streaks (user_id, current_streak, longest_streak, last_logged_date)
    VALUES (NEW.user_id, 1, 1, logged_date);
  ELSE
    IF last_date IS NULL OR logged_date > last_date THEN
      IF last_date IS NULL OR logged_date = last_date + 1 THEN
        current_str := current_str + 1;
      ELSIF logged_date > last_date + 1 THEN
        current_str := 1;
      END IF;

      IF current_str > longest_str THEN
        longest_str := current_str;
      END IF;

      UPDATE user_streaks
      SET current_streak = current_str,
          longest_streak = longest_str,
          last_logged_date = logged_date
      WHERE user_id = NEW.user_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_streak
  AFTER INSERT ON food_entries
  FOR EACH ROW EXECUTE FUNCTION update_user_streak();

-- ============================================
-- CREATE USER SETTINGS ON SIGNUP
-- ============================================
CREATE OR REPLACE FUNCTION create_user_settings()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO user_streaks (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_create_user_settings
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_user_settings();

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_entry_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_streaks ENABLE ROW LEVEL SECURITY;

-- Ingredients: Users can see default + their own
CREATE POLICY "Users can view default and own ingredients"
  ON ingredients FOR SELECT
  USING (is_default = true OR auth.uid() = user_id);

CREATE POLICY "Users can insert own ingredients"
  ON ingredients FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ingredients"
  ON ingredients FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own ingredients"
  ON ingredients FOR DELETE
  USING (auth.uid() = user_id AND is_default = false);

-- Recipes: Users can only see their own
CREATE POLICY "Users can view own recipes"
  ON recipes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own recipes"
  ON recipes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own recipes"
  ON recipes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own recipes"
  ON recipes FOR DELETE
  USING (auth.uid() = user_id);

-- Recipe Ingredients: Based on recipe ownership
CREATE POLICY "Users can view own recipe ingredients"
  ON recipe_ingredients FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM recipes WHERE recipes.id = recipe_ingredients.recipe_id AND recipes.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert own recipe ingredients"
  ON recipe_ingredients FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM recipes WHERE recipes.id = recipe_ingredients.recipe_id AND recipes.user_id = auth.uid()
  ));

CREATE POLICY "Users can update own recipe ingredients"
  ON recipe_ingredients FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM recipes WHERE recipes.id = recipe_ingredients.recipe_id AND recipes.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own recipe ingredients"
  ON recipe_ingredients FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM recipes WHERE recipes.id = recipe_ingredients.recipe_id AND recipes.user_id = auth.uid()
  ));

-- Food Entries: Users can only see their own
CREATE POLICY "Users can view own food entries"
  ON food_entries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own food entries"
  ON food_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own food entries"
  ON food_entries FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own food entries"
  ON food_entries FOR DELETE
  USING (auth.uid() = user_id);

-- Food Entry Ingredients: Based on entry ownership
CREATE POLICY "Users can view own food entry ingredients"
  ON food_entry_ingredients FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM food_entries WHERE food_entries.id = food_entry_ingredients.food_entry_id AND food_entries.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert own food entry ingredients"
  ON food_entry_ingredients FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM food_entries WHERE food_entries.id = food_entry_ingredients.food_entry_id AND food_entries.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own food entry ingredients"
  ON food_entry_ingredients FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM food_entries WHERE food_entries.id = food_entry_ingredients.food_entry_id AND food_entries.user_id = auth.uid()
  ));

-- User Settings: Users can only see/modify their own
CREATE POLICY "Users can view own settings"
  ON user_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own settings"
  ON user_settings FOR UPDATE
  USING (auth.uid() = user_id);

-- User Streaks: Users can only see their own
CREATE POLICY "Users can view own streaks"
  ON user_streaks FOR SELECT
  USING (auth.uid() = user_id);
