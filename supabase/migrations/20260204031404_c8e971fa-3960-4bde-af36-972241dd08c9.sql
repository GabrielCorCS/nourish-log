-- Fix Google OAuth signup loop caused by user_settings/user_streaks FK -> app_users
-- Root cause: handle_new_user() inserts into user_settings/user_streaks using auth.users.id,
-- but app_users row with that id does not exist (and existing app_users row uses a different UUID).
--
-- Strategy:
-- 1) Update FKs referencing app_users(id) to ON UPDATE CASCADE so we can migrate an existing demo/seed app_users row
--    to the auth uid safely.
-- 2) Update handle_new_user() to upsert/migrate app_users first, then create profile/roles/settings.

BEGIN;

-- 1) Make all app_users FKs cascade on id changes
ALTER TABLE public.ingredients
  DROP CONSTRAINT IF EXISTS ingredients_user_id_fkey;
ALTER TABLE public.ingredients
  ADD CONSTRAINT ingredients_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES public.app_users(id)
  ON UPDATE CASCADE
  ON DELETE CASCADE;

ALTER TABLE public.recipes
  DROP CONSTRAINT IF EXISTS recipes_user_id_fkey;
ALTER TABLE public.recipes
  ADD CONSTRAINT recipes_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES public.app_users(id)
  ON UPDATE CASCADE
  ON DELETE CASCADE;

ALTER TABLE public.food_entries
  DROP CONSTRAINT IF EXISTS food_entries_user_id_fkey;
ALTER TABLE public.food_entries
  ADD CONSTRAINT food_entries_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES public.app_users(id)
  ON UPDATE CASCADE
  ON DELETE CASCADE;

ALTER TABLE public.user_settings
  DROP CONSTRAINT IF EXISTS user_settings_user_id_fkey;
ALTER TABLE public.user_settings
  ADD CONSTRAINT user_settings_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES public.app_users(id)
  ON UPDATE CASCADE
  ON DELETE CASCADE;

ALTER TABLE public.user_streaks
  DROP CONSTRAINT IF EXISTS user_streaks_user_id_fkey;
ALTER TABLE public.user_streaks
  ADD CONSTRAINT user_streaks_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES public.app_users(id)
  ON UPDATE CASCADE
  ON DELETE CASCADE;

-- 2) Update the auth.users trigger handler to create/migrate app_users first
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_meta_name text;
  v_profile_name text;
  v_existing_app_user_id uuid;
  v_existing_name text;
  v_existing_avatar text;
  v_existing_is_admin boolean;
  v_is_admin boolean;
BEGIN
  -- Enforce invitation-only signups
  IF NOT public.is_email_invited(NEW.email) THEN
    RAISE EXCEPTION 'Email not on invite list';
  END IF;

  v_meta_name := COALESCE(
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'full_name',
    split_part(NEW.email, '@', 1)
  );

  -- If there is a legacy/demo app_users row for this email, migrate it to auth uid.
  SELECT id, name, avatar_emoji, is_admin
    INTO v_existing_app_user_id, v_existing_name, v_existing_avatar, v_existing_is_admin
  FROM public.app_users
  WHERE lower(email) = lower(NEW.email)
  LIMIT 1;

  IF FOUND THEN
    -- Keep existing values (so you don't lose seeded admin flag/avatar/name)
    v_profile_name := COALESCE(v_existing_name, v_meta_name);

    -- Move the app user (and all dependent rows) to the auth uid.
    -- This relies on ON UPDATE CASCADE constraints above.
    UPDATE public.app_users
    SET id = NEW.id,
        name = v_profile_name,
        avatar_emoji = COALESCE(v_existing_avatar, '👤')
    WHERE id = v_existing_app_user_id;
  ELSE
    v_profile_name := v_meta_name;

    INSERT INTO public.app_users (id, email, name, avatar_emoji, is_admin)
    VALUES (NEW.id, NEW.email, v_profile_name, '👤', false);
  END IF;

  -- Determine admin based on the (now canonical) app_users row
  SELECT is_admin INTO v_is_admin
  FROM public.app_users
  WHERE id = NEW.id;

  -- Create/update profile
  INSERT INTO public.profiles (id, email, name, avatar_emoji)
  VALUES (NEW.id, NEW.email, v_profile_name, '👤')
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email,
      name = EXCLUDED.name;

  -- Assign roles
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;

  IF COALESCE(v_is_admin, false) THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  -- Ensure default settings/streak exist (FKs now satisfied)
  INSERT INTO public.user_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.user_streaks (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

COMMIT;