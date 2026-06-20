-- ============================================================================
-- Overhaul Phase 1a — Households, sharing RLS, identity consolidation
-- Idempotent / re-runnable. Applied to a near-empty DB; preserves existing
-- users, seed ingredients, and the handful of recipe/food rows.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. HOUSEHOLDS (a private space shared by exactly the people in it)
-- ----------------------------------------------------------------------------
create table if not exists public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Our Household',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.household_members (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  user_id uuid not null references public.app_users(id) on update cascade on delete cascade,
  role text not null default 'member',
  created_at timestamptz not null default now(),
  unique (user_id)
);
create index if not exists idx_household_members_household on public.household_members(household_id);

alter table public.households enable row level security;
alter table public.household_members enable row level security;

-- ----------------------------------------------------------------------------
-- 2. SECURITY-DEFINER helpers (bypass RLS internally -> no policy recursion)
-- ----------------------------------------------------------------------------
create or replace function public.my_household_id()
returns uuid language sql stable security definer set search_path = public as $$
  select household_id from public.household_members where user_id = auth.uid() limit 1;
$$;

create or replace function public.household_id_for(_user_id uuid)
returns uuid language sql stable security definer set search_path = public as $$
  select household_id from public.household_members where user_id = _user_id limit 1;
$$;

create or replace function public.is_my_household(_household_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.household_members
    where household_id = _household_id and user_id = auth.uid()
  );
$$;

-- true if _user_id shares a household with the caller (includes the caller)
create or replace function public.same_household(_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from public.household_members me
    join public.household_members them on them.household_id = me.household_id
    where me.user_id = auth.uid() and them.user_id = _user_id
  );
$$;

-- ----------------------------------------------------------------------------
-- 3. Seed the single household and add every existing app_user to it
-- ----------------------------------------------------------------------------
insert into public.households (name)
select 'Our Household'
where not exists (select 1 from public.households);

insert into public.household_members (household_id, user_id)
select (select id from public.households order by created_at limit 1), u.id
from public.app_users u
where not exists (select 1 from public.household_members m where m.user_id = u.id);

-- ----------------------------------------------------------------------------
-- 4. Add household_id to SHARED resources and backfill from each row's owner
-- ----------------------------------------------------------------------------
alter table public.ingredients        add column if not exists household_id uuid references public.households(id) on delete cascade;
alter table public.recipes            add column if not exists household_id uuid references public.households(id) on delete cascade;
alter table public.stores             add column if not exists household_id uuid references public.households(id) on delete cascade;
alter table public.grocery_inventory  add column if not exists household_id uuid references public.households(id) on delete cascade;
alter table public.grocery_purchases  add column if not exists household_id uuid references public.households(id) on delete cascade;
alter table public.shopping_list      add column if not exists household_id uuid references public.households(id) on delete cascade;

create index if not exists idx_ingredients_household       on public.ingredients(household_id);
create index if not exists idx_recipes_household           on public.recipes(household_id);
create index if not exists idx_stores_household            on public.stores(household_id);
create index if not exists idx_grocery_inventory_household on public.grocery_inventory(household_id);
create index if not exists idx_grocery_purchases_household on public.grocery_purchases(household_id);
create index if not exists idx_shopping_list_household     on public.shopping_list(household_id);

update public.ingredients       set household_id = public.household_id_for(user_id) where household_id is null and user_id is not null;
update public.recipes           set household_id = public.household_id_for(user_id) where household_id is null;
update public.stores            set household_id = public.household_id_for(user_id) where household_id is null;
update public.grocery_inventory set household_id = public.household_id_for(user_id) where household_id is null;
update public.grocery_purchases set household_id = public.household_id_for(user_id) where household_id is null;
update public.shopping_list     set household_id = public.household_id_for(user_id) where household_id is null;

-- ----------------------------------------------------------------------------
-- 5. PROXY LOGGING: who actually entered a personal row (subject stays user_id)
-- ----------------------------------------------------------------------------
alter table public.food_entries add column if not exists logged_by uuid
  references public.app_users(id) on update cascade on delete set null;
update public.food_entries set logged_by = user_id where logged_by is null;

-- ----------------------------------------------------------------------------
-- 6. RLS REWRITE — drop every existing policy on data tables, recreate as
--    household-aware. Shared resources keyed by household_id; personal
--    resources keyed by user_id but visible+writable to household co-members.
-- ----------------------------------------------------------------------------
do $$
declare r record;
begin
  for r in
    select policyname, tablename from pg_policies
    where schemaname = 'public'
      and tablename = any (array[
        'app_users','ingredients','recipes','recipe_ingredients',
        'food_entries','food_entry_ingredients','stores',
        'grocery_inventory','grocery_purchases','shopping_list',
        'user_settings','user_streaks'
      ])
  loop
    execute format('drop policy if exists %I on public.%I', r.policyname, r.tablename);
  end loop;
end $$;

-- app_users: always read self, plus household co-members, plus admins; edit self
create policy "view self/household app_users" on public.app_users for select
  using (id = auth.uid() or public.same_household(id) or public.has_role(auth.uid(), 'admin'::public.app_role));
create policy "update own app_user" on public.app_users for update
  using (id = auth.uid()) with check (id = auth.uid());
create policy "admins manage app_users" on public.app_users for all
  using (public.has_role(auth.uid(), 'admin'::public.app_role))
  with check (public.has_role(auth.uid(), 'admin'::public.app_role));

-- ingredients (shared library + global defaults)
create policy "view default/household ingredients" on public.ingredients for select
  using (is_default or public.is_my_household(household_id));
create policy "insert household ingredients" on public.ingredients for insert
  with check (public.is_my_household(household_id));
create policy "update household ingredients" on public.ingredients for update
  using (public.is_my_household(household_id));
create policy "delete household ingredients" on public.ingredients for delete
  using (public.is_my_household(household_id));

-- recipes (shared library)
create policy "view household recipes" on public.recipes for select using (public.is_my_household(household_id));
create policy "insert household recipes" on public.recipes for insert with check (public.is_my_household(household_id));
create policy "update household recipes" on public.recipes for update using (public.is_my_household(household_id));
create policy "delete household recipes" on public.recipes for delete using (public.is_my_household(household_id));

-- recipe_ingredients (scoped via parent recipe)
create policy "view household recipe_ingredients" on public.recipe_ingredients for select
  using (exists (select 1 from public.recipes r where r.id = recipe_id and public.is_my_household(r.household_id)));
create policy "insert household recipe_ingredients" on public.recipe_ingredients for insert
  with check (exists (select 1 from public.recipes r where r.id = recipe_id and public.is_my_household(r.household_id)));
create policy "update household recipe_ingredients" on public.recipe_ingredients for update
  using (exists (select 1 from public.recipes r where r.id = recipe_id and public.is_my_household(r.household_id)));
create policy "delete household recipe_ingredients" on public.recipe_ingredients for delete
  using (exists (select 1 from public.recipes r where r.id = recipe_id and public.is_my_household(r.household_id)));

-- food_entries (personal subject, household-visible + proxy-writable)
create policy "view household food_entries" on public.food_entries for select using (public.same_household(user_id));
create policy "insert household food_entries" on public.food_entries for insert with check (public.same_household(user_id));
create policy "update household food_entries" on public.food_entries for update using (public.same_household(user_id));
create policy "delete household food_entries" on public.food_entries for delete using (public.same_household(user_id));

-- food_entry_ingredients (scoped via parent food_entry)
create policy "view household fe_ingredients" on public.food_entry_ingredients for select
  using (exists (select 1 from public.food_entries f where f.id = food_entry_id and public.same_household(f.user_id)));
create policy "insert household fe_ingredients" on public.food_entry_ingredients for insert
  with check (exists (select 1 from public.food_entries f where f.id = food_entry_id and public.same_household(f.user_id)));
create policy "update household fe_ingredients" on public.food_entry_ingredients for update
  using (exists (select 1 from public.food_entries f where f.id = food_entry_id and public.same_household(f.user_id)));
create policy "delete household fe_ingredients" on public.food_entry_ingredients for delete
  using (exists (select 1 from public.food_entries f where f.id = food_entry_id and public.same_household(f.user_id)));

-- stores / grocery_inventory / grocery_purchases / shopping_list (shared by household)
create policy "view household stores" on public.stores for select using (public.is_my_household(household_id));
create policy "insert household stores" on public.stores for insert with check (public.is_my_household(household_id));
create policy "update household stores" on public.stores for update using (public.is_my_household(household_id));
create policy "delete household stores" on public.stores for delete using (public.is_my_household(household_id));

create policy "view household inventory" on public.grocery_inventory for select using (public.is_my_household(household_id));
create policy "insert household inventory" on public.grocery_inventory for insert with check (public.is_my_household(household_id));
create policy "update household inventory" on public.grocery_inventory for update using (public.is_my_household(household_id));
create policy "delete household inventory" on public.grocery_inventory for delete using (public.is_my_household(household_id));

create policy "view household purchases" on public.grocery_purchases for select using (public.is_my_household(household_id));
create policy "insert household purchases" on public.grocery_purchases for insert with check (public.is_my_household(household_id));
create policy "update household purchases" on public.grocery_purchases for update using (public.is_my_household(household_id));
create policy "delete household purchases" on public.grocery_purchases for delete using (public.is_my_household(household_id));

create policy "view household shopping_list" on public.shopping_list for select using (public.is_my_household(household_id));
create policy "insert household shopping_list" on public.shopping_list for insert with check (public.is_my_household(household_id));
create policy "update household shopping_list" on public.shopping_list for update using (public.is_my_household(household_id));
create policy "delete household shopping_list" on public.shopping_list for delete using (public.is_my_household(household_id));

-- user_settings (personal; household-visible so partner rings can render, self-edit)
create policy "view household settings" on public.user_settings for select using (public.same_household(user_id));
create policy "insert own settings" on public.user_settings for insert with check (user_id = auth.uid());
create policy "update own settings" on public.user_settings for update using (user_id = auth.uid());

-- user_streaks (personal; household-visible; trigger-maintained)
create policy "view household streaks" on public.user_streaks for select using (public.same_household(user_id));
create policy "insert household streaks" on public.user_streaks for insert with check (public.same_household(user_id));
create policy "update household streaks" on public.user_streaks for update using (public.same_household(user_id));

-- households / household_members policies
drop policy if exists "view own household" on public.households;
create policy "view own household" on public.households for select using (public.is_my_household(id));
drop policy if exists "update own household" on public.households;
create policy "update own household" on public.households for update using (public.is_my_household(id));

drop policy if exists "view household members" on public.household_members;
create policy "view household members" on public.household_members for select using (household_id = public.my_household_id());
drop policy if exists "manage household members" on public.household_members;
create policy "manage household members" on public.household_members for all
  using (household_id = public.my_household_id())
  with check (household_id = public.my_household_id());

-- ----------------------------------------------------------------------------
-- 7. IDENTITY CONSOLIDATION — app_users is canonical; drop redundant profiles
--    and stop writing it in the signup trigger.
-- ----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path to 'public' as $function$
declare
  v_meta_name text;
  v_profile_name text;
  v_existing_app_user_id uuid;
  v_existing_name text;
  v_existing_avatar text;
  v_existing_is_admin boolean;
  v_is_admin boolean;
begin
  if not public.is_email_invited(NEW.email) then
    raise exception 'Email not on invite list';
  end if;

  v_meta_name := coalesce(
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'full_name',
    split_part(NEW.email, '@', 1)
  );

  select id, name, avatar_emoji, is_admin
    into v_existing_app_user_id, v_existing_name, v_existing_avatar, v_existing_is_admin
  from public.app_users where lower(email) = lower(NEW.email) limit 1;

  if found then
    v_profile_name := coalesce(v_existing_name, v_meta_name);
    update public.app_users
      set id = NEW.id, name = v_profile_name, avatar_emoji = coalesce(v_existing_avatar, '👤')
    where id = v_existing_app_user_id;
  else
    v_profile_name := v_meta_name;
    insert into public.app_users (id, email, name, avatar_emoji, is_admin)
    values (NEW.id, NEW.email, v_profile_name, '👤', false);
  end if;

  select is_admin into v_is_admin from public.app_users where id = NEW.id;

  insert into public.user_roles (user_id, role) values (NEW.id, 'user')
    on conflict (user_id, role) do nothing;
  if coalesce(v_is_admin, false) then
    insert into public.user_roles (user_id, role) values (NEW.id, 'admin')
      on conflict (user_id, role) do nothing;
  end if;

  insert into public.user_settings (user_id) values (NEW.id) on conflict (user_id) do nothing;
  insert into public.user_streaks (user_id) values (NEW.id) on conflict (user_id) do nothing;

  return NEW;
end;
$function$;

drop table if exists public.profiles cascade;
