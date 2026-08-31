-- ============================================================================
-- Make the stale-account sweep agree with the app's "completed" signal.
--
-- Completion is now recorded as a user-metadata flag (passkey_completed=true),
-- set by the client only after a passkey ceremony actually succeeds. Detect
-- ghosts by the ABSENCE of that flag rather than by querying auth.mfa_factors
-- (whose beta shape we don't want to depend on). Fails safe: a completed
-- account has the flag and is never swept.
-- ============================================================================
create or replace function public.sweep_stale_accounts(
  p_grace interval default interval '24 hours',
  p_fake_domain text default 'users.cup-trail.com'
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_deleted integer := 0;
begin
  with doomed as (
    select u.id
      from auth.users u
     where u.created_at < now() - p_grace
       -- never delete anyone who has authored data
       and not exists (select 1 from public.reviews r where r.user_id = u.id)
       and (
             u.is_anonymous = true
          or (
               -- placeholder-email ghost that never completed passkey setup
               u.email like '%@' || p_fake_domain
               and coalesce(u.raw_user_meta_data->>'passkey_completed', '')
                     <> 'true'
             )
           )
  )
  delete from auth.users where id in (select id from doomed);
  get diagnostics v_deleted = row_count;
  return v_deleted;
end;
$$;

revoke all on function public.sweep_stale_accounts(interval, text)
  from public, anon, authenticated;
grant execute on function public.sweep_stale_accounts(interval, text) to service_role;
