-- ============================================================================
-- Overhaul Phase 1d — "Share access by email" RPC
-- RLS hides app_users rows outside your household, so linking a partner needs a
-- SECURITY DEFINER function to resolve the email and add the membership.
-- Idempotent.
-- ============================================================================
create or replace function public.add_household_member_by_email(_email text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_household uuid;
  v_user uuid;
begin
  select household_id into v_household
  from public.household_members where user_id = auth.uid() limit 1;
  if v_household is null then
    raise exception 'You are not part of a household yet';
  end if;

  select id into v_user from public.app_users where lower(email) = lower(_email) limit 1;
  if v_user is null then
    raise exception 'No NourishLog account found for %, ask them to sign in once first', _email;
  end if;

  insert into public.household_members (household_id, user_id)
  values (v_household, v_user)
  on conflict (user_id) do update set household_id = excluded.household_id;
end;
$$;

revoke all on function public.add_household_member_by_email(text) from public;
grant execute on function public.add_household_member_by_email(text) to authenticated;
