-- ============================================================================
-- Renpho scaffold — body_metrics (weight + body composition)
-- Source-agnostic: a `source` enum tags where each reading came from. RLS mirrors
-- food_entries (personal subject, household-visible + proxy-writable via logged_by)
-- so a partner can log/see weigh-ins. Idempotent.
-- ============================================================================

do $$
begin
  create type public.body_metric_source as enum (
    'manual', 'renpho', 'apple_health', 'google_fit', 'health_connect'
  );
exception
  when duplicate_object then null;
end $$;

create table if not exists public.body_metrics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users(id) on update cascade on delete cascade,
  logged_by uuid references public.app_users(id) on update cascade on delete set null,
  measured_at timestamptz not null default now(),
  weight_kg numeric,
  body_fat_pct numeric,
  muscle_mass_kg numeric,
  bmi numeric,
  water_pct numeric,
  bone_mass_kg numeric,
  source public.body_metric_source not null default 'manual',
  raw jsonb,            -- original device/bridge payload, for the future Renpho sync
  notes text,
  created_at timestamptz not null default now()
);
create index if not exists idx_body_metrics_user_measured
  on public.body_metrics(user_id, measured_at desc);

alter table public.body_metrics enable row level security;

drop policy if exists "view household body_metrics" on public.body_metrics;
create policy "view household body_metrics" on public.body_metrics for select
  using (public.same_household(user_id));
drop policy if exists "insert household body_metrics" on public.body_metrics;
create policy "insert household body_metrics" on public.body_metrics for insert
  with check (public.same_household(user_id));
drop policy if exists "update household body_metrics" on public.body_metrics;
create policy "update household body_metrics" on public.body_metrics for update
  using (public.same_household(user_id));
drop policy if exists "delete household body_metrics" on public.body_metrics;
create policy "delete household body_metrics" on public.body_metrics for delete
  using (public.same_household(user_id));

-- Weight-unit display preference (lb/kg)
alter table public.user_settings add column if not exists weight_unit text not null default 'lb';
