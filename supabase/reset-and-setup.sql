-- ============================================
-- NOURISHLOG COMPLETE DATABASE RESET & SETUP
-- ============================================
-- Copy this ENTIRE file into Supabase SQL Editor and run it.
-- ============================================

-- STEP 1: Drop all existing tables
DROP TABLE IF EXISTS food_entry_ingredients CASCADE;
DROP TABLE IF EXISTS food_entries CASCADE;
DROP TABLE IF EXISTS recipe_ingredients CASCADE;
DROP TABLE IF EXISTS recipes CASCADE;
DROP TABLE IF EXISTS ingredients CASCADE;
DROP TABLE IF EXISTS user_streaks CASCADE;
DROP TABLE IF EXISTS user_settings CASCADE;
DROP TABLE IF EXISTS app_users CASCADE;
DROP TYPE IF EXISTS meal_type CASCADE;
DROP TYPE IF EXISTS ingredient_category CASCADE;
DROP FUNCTION IF EXISTS update_updated_at CASCADE;
DROP FUNCTION IF EXISTS calculate_recipe_nutrition CASCADE;
DROP FUNCTION IF EXISTS update_user_streak CASCADE;
DROP FUNCTION IF EXISTS create_user_settings CASCADE;

-- STEP 2: Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- STEP 3: Create app_users table
CREATE TABLE app_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  avatar_emoji TEXT DEFAULT '👤',
  is_admin BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_app_users_email ON app_users(email);

-- STEP 4: Create enums
CREATE TYPE ingredient_category AS ENUM (
  'proteins', 'grains', 'vegetables', 'fruits', 'dairy',
  'fats', 'legumes', 'nuts', 'condiments', 'beverages'
);

CREATE TYPE meal_type AS ENUM ('breakfast', 'lunch', 'dinner', 'snack');

-- STEP 5: Create ingredients table
CREATE TABLE ingredients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES app_users(id) ON DELETE CASCADE,
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
CREATE INDEX idx_ingredients_user_id ON ingredients(user_id);
CREATE INDEX idx_ingredients_category ON ingredients(category);

-- STEP 6: Create recipes table
CREATE TABLE recipes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  emoji TEXT,
  description TEXT,
  instructions TEXT,
  servings INTEGER NOT NULL DEFAULT 1,
  prep_time INTEGER,
  cook_time INTEGER,
  total_calories DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_protein DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_carbs DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_fat DECIMAL(10,2) NOT NULL DEFAULT 0,
  is_favorite BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_recipes_user_id ON recipes(user_id);

-- STEP 7: Create recipe_ingredients table
CREATE TABLE recipe_ingredients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  ingredient_id UUID NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
  quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(recipe_id, ingredient_id)
);
CREATE INDEX idx_recipe_ingredients_recipe_id ON recipe_ingredients(recipe_id);

-- STEP 8: Create food_entries table
CREATE TABLE food_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
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
CREATE INDEX idx_food_entries_user_id ON food_entries(user_id);
CREATE INDEX idx_food_entries_logged_at ON food_entries(logged_at);

-- STEP 9: Create food_entry_ingredients table
CREATE TABLE food_entry_ingredients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  food_entry_id UUID NOT NULL REFERENCES food_entries(id) ON DELETE CASCADE,
  ingredient_id UUID NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
  quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(food_entry_id, ingredient_id)
);

-- STEP 10: Create user_settings table
CREATE TABLE user_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES app_users(id) ON DELETE CASCADE,
  daily_calorie_goal INTEGER NOT NULL DEFAULT 2000,
  daily_protein_goal INTEGER NOT NULL DEFAULT 150,
  daily_carbs_goal INTEGER NOT NULL DEFAULT 250,
  daily_fat_goal INTEGER NOT NULL DEFAULT 65,
  theme TEXT NOT NULL DEFAULT 'light',
  notifications_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- STEP 11: Create user_streaks table
CREATE TABLE user_streaks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES app_users(id) ON DELETE CASCADE,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_logged_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- STEP 12: Create triggers
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_app_users_updated_at BEFORE UPDATE ON app_users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_ingredients_updated_at BEFORE UPDATE ON ingredients FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_recipes_updated_at BEFORE UPDATE ON recipes FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_food_entries_updated_at BEFORE UPDATE ON food_entries FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_user_streaks_updated_at BEFORE UPDATE ON user_streaks FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE FUNCTION calculate_recipe_nutrition()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE recipes SET
    total_calories = (SELECT COALESCE(SUM(i.calories * ri.quantity), 0) FROM recipe_ingredients ri JOIN ingredients i ON i.id = ri.ingredient_id WHERE ri.recipe_id = COALESCE(NEW.recipe_id, OLD.recipe_id)),
    total_protein = (SELECT COALESCE(SUM(i.protein * ri.quantity), 0) FROM recipe_ingredients ri JOIN ingredients i ON i.id = ri.ingredient_id WHERE ri.recipe_id = COALESCE(NEW.recipe_id, OLD.recipe_id)),
    total_carbs = (SELECT COALESCE(SUM(i.carbs * ri.quantity), 0) FROM recipe_ingredients ri JOIN ingredients i ON i.id = ri.ingredient_id WHERE ri.recipe_id = COALESCE(NEW.recipe_id, OLD.recipe_id)),
    total_fat = (SELECT COALESCE(SUM(i.fat * ri.quantity), 0) FROM recipe_ingredients ri JOIN ingredients i ON i.id = ri.ingredient_id WHERE ri.recipe_id = COALESCE(NEW.recipe_id, OLD.recipe_id))
  WHERE id = COALESCE(NEW.recipe_id, OLD.recipe_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_recipe_nutrition AFTER INSERT OR UPDATE OR DELETE ON recipe_ingredients FOR EACH ROW EXECUTE FUNCTION calculate_recipe_nutrition();

CREATE OR REPLACE FUNCTION update_user_streak()
RETURNS TRIGGER AS $$
DECLARE
  logged_date DATE;
  last_date DATE;
  current_str INTEGER;
  longest_str INTEGER;
BEGIN
  logged_date := DATE(NEW.logged_at);
  SELECT last_logged_date, current_streak, longest_streak INTO last_date, current_str, longest_str FROM user_streaks WHERE user_id = NEW.user_id;
  IF NOT FOUND THEN
    INSERT INTO user_streaks (user_id, current_streak, longest_streak, last_logged_date) VALUES (NEW.user_id, 1, 1, logged_date);
  ELSE
    IF last_date IS NULL OR logged_date > last_date THEN
      IF last_date IS NULL OR logged_date = last_date + 1 THEN current_str := current_str + 1;
      ELSIF logged_date > last_date + 1 THEN current_str := 1;
      END IF;
      IF current_str > longest_str THEN longest_str := current_str; END IF;
      UPDATE user_streaks SET current_streak = current_str, longest_streak = longest_str, last_logged_date = logged_date WHERE user_id = NEW.user_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_streak AFTER INSERT ON food_entries FOR EACH ROW EXECUTE FUNCTION update_user_streak();

CREATE OR REPLACE FUNCTION create_user_settings()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_settings (user_id) VALUES (NEW.id) ON CONFLICT (user_id) DO NOTHING;
  INSERT INTO user_streaks (user_id) VALUES (NEW.id) ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_user_settings AFTER INSERT ON app_users FOR EACH ROW EXECUTE FUNCTION create_user_settings();

-- ============================================
-- STEP 13: CREATE YOUR ADMIN USER
-- ============================================
INSERT INTO app_users (email, name, avatar_emoji, is_admin) VALUES
('gabrielcordova.wk@gmail.com', 'Gabriel', '👑', true);

-- ============================================
-- STEP 14: SEED DEFAULT INGREDIENTS
-- ============================================
INSERT INTO ingredients (name, emoji, category, serving_size, serving_unit, calories, protein, carbs, fat, is_default) VALUES
('Chicken Breast', '🍗', 'proteins', 100, 'g', 165, 31, 0, 3.6, true),
('Salmon Fillet', '🐟', 'proteins', 100, 'g', 208, 20, 0, 13, true),
('Ground Beef (90% lean)', '🥩', 'proteins', 100, 'g', 176, 20, 0, 10, true),
('Eggs', '🥚', 'proteins', 1, 'piece', 72, 6, 0.4, 5, true),
('Tofu (firm)', '🧈', 'proteins', 100, 'g', 144, 17, 3, 8, true),
('Shrimp', '🍤', 'proteins', 100, 'g', 99, 24, 0.2, 0.3, true),
('Turkey Breast', '🦃', 'proteins', 100, 'g', 135, 30, 0, 1, true),
('Tuna (canned)', '🐟', 'proteins', 100, 'g', 116, 26, 0, 1, true),
('Pork Tenderloin', '🥓', 'proteins', 100, 'g', 143, 26, 0, 3.5, true),
('Greek Yogurt', '🥛', 'proteins', 150, 'g', 100, 17, 6, 0.7, true),
('Brown Rice (cooked)', '🍚', 'grains', 100, 'g', 112, 2.6, 24, 0.9, true),
('Quinoa (cooked)', '🌾', 'grains', 100, 'g', 120, 4.4, 21, 1.9, true),
('Oats (rolled)', '🥣', 'grains', 40, 'g', 152, 5.3, 27, 2.7, true),
('Whole Wheat Bread', '🍞', 'grains', 1, 'slice', 81, 4, 14, 1.1, true),
('Pasta (cooked)', '🍝', 'grains', 100, 'g', 131, 5, 25, 1.1, true),
('White Rice (cooked)', '🍚', 'grains', 100, 'g', 130, 2.7, 28, 0.3, true),
('Broccoli', '🥦', 'vegetables', 100, 'g', 34, 2.8, 7, 0.4, true),
('Spinach', '🥬', 'vegetables', 100, 'g', 23, 2.9, 3.6, 0.4, true),
('Sweet Potato', '🍠', 'vegetables', 100, 'g', 86, 1.6, 20, 0.1, true),
('Bell Pepper', '🫑', 'vegetables', 100, 'g', 31, 1, 6, 0.3, true),
('Carrots', '🥕', 'vegetables', 100, 'g', 41, 0.9, 10, 0.2, true),
('Tomatoes', '🍅', 'vegetables', 100, 'g', 18, 0.9, 3.9, 0.2, true),
('Zucchini', '🥒', 'vegetables', 100, 'g', 17, 1.2, 3.1, 0.3, true),
('Kale', '🥬', 'vegetables', 100, 'g', 35, 2.9, 4.4, 1.5, true),
('Banana', '🍌', 'fruits', 1, 'piece', 105, 1.3, 27, 0.4, true),
('Apple', '🍎', 'fruits', 1, 'piece', 95, 0.5, 25, 0.3, true),
('Blueberries', '🫐', 'fruits', 100, 'g', 57, 0.7, 14, 0.3, true),
('Avocado', '🥑', 'fruits', 100, 'g', 160, 2, 9, 15, true),
('Orange', '🍊', 'fruits', 1, 'piece', 62, 1.2, 15, 0.2, true),
('Milk (2%)', '🥛', 'dairy', 240, 'ml', 122, 8, 12, 5, true),
('Cheddar Cheese', '🧀', 'dairy', 30, 'g', 113, 7, 0.4, 9, true),
('Cottage Cheese', '🧈', 'dairy', 100, 'g', 98, 11, 3.4, 4.3, true),
('Olive Oil', '🫒', 'fats', 1, 'tbsp', 119, 0, 0, 13.5, true),
('Butter', '🧈', 'fats', 1, 'tbsp', 102, 0.1, 0, 12, true),
('Coconut Oil', '🥥', 'fats', 1, 'tbsp', 121, 0, 0, 13.5, true),
('Black Beans (cooked)', '🫘', 'legumes', 100, 'g', 132, 8.9, 24, 0.5, true),
('Lentils (cooked)', '🫘', 'legumes', 100, 'g', 116, 9, 20, 0.4, true),
('Chickpeas (cooked)', '🫘', 'legumes', 100, 'g', 164, 8.9, 27, 2.6, true),
('Almonds', '🥜', 'nuts', 30, 'g', 173, 6, 6, 15, true),
('Peanut Butter', '🥜', 'nuts', 2, 'tbsp', 188, 8, 6, 16, true);

-- Done! Your database is now set up.
