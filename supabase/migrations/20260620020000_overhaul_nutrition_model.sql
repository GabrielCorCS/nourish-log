-- ============================================================================
-- Overhaul Phase 1b — Nutrition scaling model
-- Adds a canonical grams/ml-per-serving basis so logging can use a "general
-- serving" OR an exact gram/ml amount and scale macros correctly. Adds product
-- metadata (barcode/brand/image/off_id) for Open Food Facts import.
-- Idempotent / re-runnable.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Ingredient: weight-per-serving + product metadata
-- ----------------------------------------------------------------------------
alter table public.ingredients add column if not exists serving_grams numeric;       -- grams (or ml) in ONE serving
alter table public.ingredients add column if not exists barcode      text;
alter table public.ingredients add column if not exists brand        text;
alter table public.ingredients add column if not exists image_url    text;
alter table public.ingredients add column if not exists off_id       text;            -- Open Food Facts code

create index if not exists idx_ingredients_barcode on public.ingredients(barcode);

-- Backfill serving_grams: trivial for g/ml; sensible defaults for the seed items
-- that use piece/slice/tbsp units (so the g/ml toggle works out of the box).
update public.ingredients set serving_grams = serving_size
  where serving_grams is null and serving_unit in ('g','ml');

update public.ingredients set serving_grams = case name
  when 'Eggs'              then 50
  when 'Whole Wheat Bread' then 28
  when 'Banana'            then 118
  when 'Apple'             then 182
  when 'Orange'            then 131
  when 'Olive Oil'         then 13.5
  when 'Butter'            then 14
  when 'Coconut Oil'       then 13.6
  when 'Peanut Butter'     then 32
  else serving_grams
end
where serving_grams is null;

-- ----------------------------------------------------------------------------
-- 2. Amount + unit on the two ingredient-link tables (keep quantity for compat)
--    unit in ('serving','g','ml'); 'serving' preserves the original math.
-- ----------------------------------------------------------------------------
alter table public.recipe_ingredients     add column if not exists amount numeric;
alter table public.recipe_ingredients     add column if not exists unit   text not null default 'serving';
alter table public.food_entry_ingredients add column if not exists amount numeric;
alter table public.food_entry_ingredients add column if not exists unit   text not null default 'serving';

update public.recipe_ingredients     set amount = quantity where amount is null;
update public.food_entry_ingredients set amount = quantity where amount is null;

-- ----------------------------------------------------------------------------
-- 3. Recipe nutrition trigger — compute from amount/unit via serving_grams.
--    factor = servings-equivalent of the ingredient:
--      unit 'serving'      -> amount
--      unit 'g' or 'ml'    -> amount / serving_grams (fallback serving_size)
-- ----------------------------------------------------------------------------
create or replace function public.calculate_recipe_nutrition()
returns trigger language plpgsql security definer set search_path = public as $$
declare rid uuid;
begin
  rid := coalesce(NEW.recipe_id, OLD.recipe_id);
  update public.recipes r set
    total_calories = sub.cal,
    total_protein  = sub.pro,
    total_carbs    = sub.carb,
    total_fat      = sub.fat
  from (
    select
      coalesce(sum(i.calories * f.factor), 0) as cal,
      coalesce(sum(i.protein  * f.factor), 0) as pro,
      coalesce(sum(i.carbs    * f.factor), 0) as carb,
      coalesce(sum(i.fat      * f.factor), 0) as fat
    from public.recipe_ingredients ri
    join public.ingredients i on i.id = ri.ingredient_id
    cross join lateral (
      select case
        when ri.unit in ('g','ml')
          then coalesce(ri.amount, ri.quantity) / nullif(coalesce(i.serving_grams, i.serving_size), 0)
        else coalesce(ri.amount, ri.quantity)
      end as factor
    ) f
    where ri.recipe_id = rid
  ) sub
  where r.id = rid;
  return coalesce(NEW, OLD);
end;
$$;

-- Recompute existing recipe totals under the new function (no-op for 'serving' rows,
-- but keeps everything consistent).
update public.recipes r set
  total_calories = sub.cal, total_protein = sub.pro, total_carbs = sub.carb, total_fat = sub.fat
from (
  select ri.recipe_id,
    coalesce(sum(i.calories * f.factor), 0) cal,
    coalesce(sum(i.protein  * f.factor), 0) pro,
    coalesce(sum(i.carbs    * f.factor), 0) carb,
    coalesce(sum(i.fat      * f.factor), 0) fat
  from public.recipe_ingredients ri
  join public.ingredients i on i.id = ri.ingredient_id
  cross join lateral (
    select case
      when ri.unit in ('g','ml')
        then coalesce(ri.amount, ri.quantity) / nullif(coalesce(i.serving_grams, i.serving_size), 0)
      else coalesce(ri.amount, ri.quantity)
    end as factor
  ) f
  group by ri.recipe_id
) sub
where r.id = sub.recipe_id;
