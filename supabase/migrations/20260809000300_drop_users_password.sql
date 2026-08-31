-- ============================================================================
-- Drop the stray public.users.password column.
--
-- Auth is handled entirely by Supabase Auth (auth.users) + passkeys; a
-- plaintext-capable password column on a public profile table has no purpose
-- and is a liability. Table was empty (0 rows) at removal time.
-- ============================================================================
alter table public.users drop column if exists password;
