-- ============================================
-- FIX REMAINING PERMISSIVE RLS POLICIES
-- ============================================

-- Fix app_users table policies (keeping for backward compatibility during migration)
DROP POLICY IF EXISTS "Allow read app_users" ON public.app_users;
DROP POLICY IF EXISTS "Allow insert app_users" ON public.app_users;
DROP POLICY IF EXISTS "Allow update app_users" ON public.app_users;
DROP POLICY IF EXISTS "Allow delete app_users" ON public.app_users;

-- app_users is legacy - admins only for management
CREATE POLICY "Admins can view app_users"
  ON public.app_users FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage app_users"
  ON public.app_users FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Fix ingredients table policies
DROP POLICY IF EXISTS "Allow read ingredients" ON public.ingredients;
DROP POLICY IF EXISTS "Allow insert ingredients" ON public.ingredients;
DROP POLICY IF EXISTS "Allow update ingredients" ON public.ingredients;
DROP POLICY IF EXISTS "Allow delete ingredients" ON public.ingredients;

-- Ingredients: users can see defaults and their own, manage their own
CREATE POLICY "Users can view default and own ingredients"
  ON public.ingredients FOR SELECT
  TO authenticated
  USING (is_default = true OR auth.uid() = user_id);

CREATE POLICY "Users can insert their own ingredients"
  ON public.ingredients FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ingredients"
  ON public.ingredients FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own ingredients"
  ON public.ingredients FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Fix recipe_ingredients table policies
DROP POLICY IF EXISTS "Allow read recipe_ingredients" ON public.recipe_ingredients;
DROP POLICY IF EXISTS "Allow insert recipe_ingredients" ON public.recipe_ingredients;
DROP POLICY IF EXISTS "Allow update recipe_ingredients" ON public.recipe_ingredients;
DROP POLICY IF EXISTS "Allow delete recipe_ingredients" ON public.recipe_ingredients;

-- recipe_ingredients: users can manage their own recipes' ingredients
CREATE POLICY "Users can view their recipe ingredients"
  ON public.recipe_ingredients FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.recipes 
      WHERE recipes.id = recipe_ingredients.recipe_id 
      AND recipes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their recipe ingredients"
  ON public.recipe_ingredients FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.recipes 
      WHERE recipes.id = recipe_ingredients.recipe_id 
      AND recipes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their recipe ingredients"
  ON public.recipe_ingredients FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.recipes 
      WHERE recipes.id = recipe_ingredients.recipe_id 
      AND recipes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their recipe ingredients"
  ON public.recipe_ingredients FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.recipes 
      WHERE recipes.id = recipe_ingredients.recipe_id 
      AND recipes.user_id = auth.uid()
    )
  );

-- Fix food_entry_ingredients table policies
DROP POLICY IF EXISTS "Allow read food_entry_ingredients" ON public.food_entry_ingredients;
DROP POLICY IF EXISTS "Allow insert food_entry_ingredients" ON public.food_entry_ingredients;
DROP POLICY IF EXISTS "Allow delete food_entry_ingredients" ON public.food_entry_ingredients;

CREATE POLICY "Users can view their food entry ingredients"
  ON public.food_entry_ingredients FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.food_entries 
      WHERE food_entries.id = food_entry_ingredients.food_entry_id 
      AND food_entries.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their food entry ingredients"
  ON public.food_entry_ingredients FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.food_entries 
      WHERE food_entries.id = food_entry_ingredients.food_entry_id 
      AND food_entries.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their food entry ingredients"
  ON public.food_entry_ingredients FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.food_entries 
      WHERE food_entries.id = food_entry_ingredients.food_entry_id 
      AND food_entries.user_id = auth.uid()
    )
  );

-- Fix old functions that don't have search_path set
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.calculate_recipe_nutrition()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE recipes SET
    total_calories = (SELECT COALESCE(SUM(i.calories * ri.quantity), 0) FROM recipe_ingredients ri JOIN ingredients i ON i.id = ri.ingredient_id WHERE ri.recipe_id = COALESCE(NEW.recipe_id, OLD.recipe_id)),
    total_protein = (SELECT COALESCE(SUM(i.protein * ri.quantity), 0) FROM recipe_ingredients ri JOIN ingredients i ON i.id = ri.ingredient_id WHERE ri.recipe_id = COALESCE(NEW.recipe_id, OLD.recipe_id)),
    total_carbs = (SELECT COALESCE(SUM(i.carbs * ri.quantity), 0) FROM recipe_ingredients ri JOIN ingredients i ON i.id = ri.ingredient_id WHERE ri.recipe_id = COALESCE(NEW.recipe_id, OLD.recipe_id)),
    total_fat = (SELECT COALESCE(SUM(i.fat * ri.quantity), 0) FROM recipe_ingredients ri JOIN ingredients i ON i.id = ri.ingredient_id WHERE ri.recipe_id = COALESCE(NEW.recipe_id, OLD.recipe_id))
  WHERE id = COALESCE(NEW.recipe_id, OLD.recipe_id);
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_user_streak()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

CREATE OR REPLACE FUNCTION public.create_user_settings()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO user_settings (user_id) VALUES (NEW.id) ON CONFLICT (user_id) DO NOTHING;
  INSERT INTO user_streaks (user_id) VALUES (NEW.id) ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;