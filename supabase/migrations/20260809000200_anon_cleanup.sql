-- ============================================================================
-- Stale account cleanup — DRAFT (Supabase has no built-in anonymous-user
-- cleanup yet, so we run our own sweep).
--
-- Removes accounts that were started but never completed:
--   * still-anonymous users, and
--   * "ghosts": placeholder-email users that never finished passkey setup
-- older than a grace window, and only when they hold no data (no reviews).
--
-- The client also best-effort deletes on explicit cancel via
-- POST /api/account/abandon; this sweep is the backstop for tab-closes,
-- crashes, and lost connections that never fire that call.
--
-- Assumptions to confirm on resume (beta surface):
--   * WebAuthn/passkey factors live in auth.mfa_factors with
--     factor_type = 'webauthn'. Confirm the table/column before relying on the
--     ghost branch; the anonymous branch is safe regardless.
--   * FAKE_EMAIL_DOMAIN below matches the value in supabase/functions/api.
-- ============================================================================

create extension if not exists pg_cron;

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
               -- placeholder-email ghost with no passkey enrolled
               u.email like '%@' || p_fake_domain
               and not exists (
                 select 1 from auth.mfa_factors f
                  where f.user_id = u.id and f.factor_type = 'webauthn'
               )
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

-- Run every 30 minutes. (Unschedule first so re-running the migration is safe.)
select cron.unschedule('sweep-stale-accounts')
 where exists (select 1 from cron.job where jobname = 'sweep-stale-accounts');

select cron.schedule(
  'sweep-stale-accounts',
  '*/30 * * * *',
  $$select public.sweep_stale_accounts();$$
);
