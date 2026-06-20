-- ============================================================================
-- Overhaul Phase 1c — Shared Inspo/Wishlist board + item-images storage bucket
-- Idempotent / re-runnable.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Shared wishlist / inspiration board (household-scoped)
-- ----------------------------------------------------------------------------
create table if not exists public.wishlist_items (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  created_by uuid references public.app_users(id) on update cascade on delete set null,
  title text not null,
  note text,
  recipe_id uuid references public.recipes(id) on delete set null,
  ingredient_id uuid references public.ingredients(id) on delete set null,
  url text,
  image_url text,
  is_done boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_wishlist_household on public.wishlist_items(household_id);

alter table public.wishlist_items enable row level security;

drop policy if exists "view household wishlist"   on public.wishlist_items;
drop policy if exists "insert household wishlist"  on public.wishlist_items;
drop policy if exists "update household wishlist"  on public.wishlist_items;
drop policy if exists "delete household wishlist"  on public.wishlist_items;
create policy "view household wishlist"   on public.wishlist_items for select using (public.is_my_household(household_id));
create policy "insert household wishlist"  on public.wishlist_items for insert with check (public.is_my_household(household_id));
create policy "update household wishlist"  on public.wishlist_items for update using (public.is_my_household(household_id));
create policy "delete household wishlist"  on public.wishlist_items for delete using (public.is_my_household(household_id));

drop trigger if exists update_wishlist_updated_at on public.wishlist_items;
create trigger update_wishlist_updated_at
  before update on public.wishlist_items
  for each row execute function public.update_updated_at();

-- ----------------------------------------------------------------------------
-- 2. Public storage bucket for item images (recipe/ingredient/wishlist photos
--    + cached Open Food Facts images)
-- ----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('item-images', 'item-images', true)
on conflict (id) do nothing;

drop policy if exists "item-images public read"   on storage.objects;
drop policy if exists "item-images auth insert"    on storage.objects;
drop policy if exists "item-images auth update"    on storage.objects;
drop policy if exists "item-images auth delete"    on storage.objects;
create policy "item-images public read" on storage.objects for select using (bucket_id = 'item-images');
create policy "item-images auth insert" on storage.objects for insert to authenticated with check (bucket_id = 'item-images');
create policy "item-images auth update" on storage.objects for update to authenticated using (bucket_id = 'item-images');
create policy "item-images auth delete" on storage.objects for delete to authenticated using (bucket_id = 'item-images');
