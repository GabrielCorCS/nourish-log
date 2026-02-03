-- ============================================
-- PHASE 1: AUTH & INVENTORY DATABASE SETUP
-- ============================================

-- 1. Create app_role enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- 2. Create profiles table linked to auth.users
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  avatar_emoji TEXT DEFAULT '👤',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- 4. Create invited_emails table for invite-only access
CREATE TABLE public.invited_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 5. Create grocery_inventory table
CREATE TABLE public.grocery_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  ingredient_id UUID REFERENCES public.ingredients(id) ON DELETE CASCADE NOT NULL,
  quantity_on_hand NUMERIC NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'g',
  threshold_quantity NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, ingredient_id)
);

-- 6. Create shopping_list table
CREATE TABLE public.shopping_list (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  ingredient_id UUID REFERENCES public.ingredients(id) ON DELETE CASCADE NOT NULL,
  quantity_needed NUMERIC NOT NULL DEFAULT 1,
  is_purchased BOOLEAN NOT NULL DEFAULT false,
  auto_added BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, ingredient_id)
);

-- ============================================
-- SECURITY DEFINER FUNCTIONS
-- ============================================

-- 7. Create has_role function for RLS (security definer to avoid recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- 8. Create is_email_invited function
CREATE OR REPLACE FUNCTION public.is_email_invited(_email TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.invited_emails
    WHERE LOWER(email) = LOWER(_email)
  )
$$;

-- 9. Create handle_new_user trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if the email is invited
  IF NOT public.is_email_invited(NEW.email) THEN
    RAISE EXCEPTION 'Email not on invite list';
  END IF;
  
  -- Create profile for the new user
  INSERT INTO public.profiles (id, email, name, avatar_emoji)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    '👤'
  );
  
  -- Assign default 'user' role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  -- Create default user_settings
  INSERT INTO public.user_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Create default user_streaks
  INSERT INTO public.user_streaks (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- 10. Create trigger on auth.users for new signups
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 11. Create check_inventory_threshold trigger function
CREATE OR REPLACE FUNCTION public.check_inventory_threshold()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If quantity dropped below threshold, add to shopping list
  IF NEW.quantity_on_hand < NEW.threshold_quantity AND NEW.threshold_quantity > 0 THEN
    INSERT INTO public.shopping_list (user_id, ingredient_id, quantity_needed, auto_added)
    VALUES (
      NEW.user_id,
      NEW.ingredient_id,
      NEW.threshold_quantity - NEW.quantity_on_hand,
      true
    )
    ON CONFLICT (user_id, ingredient_id) 
    DO UPDATE SET 
      quantity_needed = EXCLUDED.quantity_needed,
      auto_added = true,
      is_purchased = false;
  END IF;
  
  RETURN NEW;
END;
$$;

-- 12. Create trigger on grocery_inventory for threshold alerts
CREATE TRIGGER on_inventory_update
  AFTER INSERT OR UPDATE ON public.grocery_inventory
  FOR EACH ROW EXECUTE FUNCTION public.check_inventory_threshold();

-- ============================================
-- ENABLE RLS ON NEW TABLES
-- ============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invited_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grocery_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopping_list ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES FOR PROFILES
-- ============================================

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- ============================================
-- RLS POLICIES FOR USER_ROLES
-- ============================================

CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- RLS POLICIES FOR INVITED_EMAILS
-- ============================================

CREATE POLICY "Admins can view invited emails"
  ON public.invited_emails FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert invited emails"
  ON public.invited_emails FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete invited emails"
  ON public.invited_emails FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- RLS POLICIES FOR GROCERY_INVENTORY
-- ============================================

CREATE POLICY "Users can view their own inventory"
  ON public.grocery_inventory FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own inventory"
  ON public.grocery_inventory FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own inventory"
  ON public.grocery_inventory FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own inventory"
  ON public.grocery_inventory FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================
-- RLS POLICIES FOR SHOPPING_LIST
-- ============================================

CREATE POLICY "Users can view their own shopping list"
  ON public.shopping_list FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own shopping list items"
  ON public.shopping_list FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own shopping list items"
  ON public.shopping_list FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own shopping list items"
  ON public.shopping_list FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================
-- UPDATE EXISTING TABLES RLS POLICIES
-- ============================================

-- Drop old permissive policies on food_entries
DROP POLICY IF EXISTS "Allow read food_entries" ON public.food_entries;
DROP POLICY IF EXISTS "Allow insert food_entries" ON public.food_entries;
DROP POLICY IF EXISTS "Allow update food_entries" ON public.food_entries;
DROP POLICY IF EXISTS "Allow delete food_entries" ON public.food_entries;

-- New RLS for food_entries
CREATE POLICY "Users can view their own food entries"
  ON public.food_entries FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own food entries"
  ON public.food_entries FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own food entries"
  ON public.food_entries FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own food entries"
  ON public.food_entries FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Drop old permissive policies on recipes
DROP POLICY IF EXISTS "Allow read recipes" ON public.recipes;
DROP POLICY IF EXISTS "Allow insert recipes" ON public.recipes;
DROP POLICY IF EXISTS "Allow update recipes" ON public.recipes;
DROP POLICY IF EXISTS "Allow delete recipes" ON public.recipes;

-- New RLS for recipes
CREATE POLICY "Users can view their own recipes"
  ON public.recipes FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own recipes"
  ON public.recipes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own recipes"
  ON public.recipes FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own recipes"
  ON public.recipes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Drop old permissive policies on user_settings
DROP POLICY IF EXISTS "Allow read user_settings" ON public.user_settings;
DROP POLICY IF EXISTS "Allow insert user_settings" ON public.user_settings;
DROP POLICY IF EXISTS "Allow update user_settings" ON public.user_settings;

-- New RLS for user_settings
CREATE POLICY "Users can view their own settings"
  ON public.user_settings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings"
  ON public.user_settings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings"
  ON public.user_settings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Drop old permissive policies on user_streaks
DROP POLICY IF EXISTS "Allow read user_streaks" ON public.user_streaks;
DROP POLICY IF EXISTS "Allow insert user_streaks" ON public.user_streaks;
DROP POLICY IF EXISTS "Allow update user_streaks" ON public.user_streaks;

-- New RLS for user_streaks
CREATE POLICY "Users can view their own streaks"
  ON public.user_streaks FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own streaks"
  ON public.user_streaks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own streaks"
  ON public.user_streaks FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================
-- SEED INITIAL ADMIN INVITE
-- ============================================

-- Add the admin email to invited_emails (the first user to sign up)
INSERT INTO public.invited_emails (email) VALUES ('gabrielcordova.wk@gmail.com');