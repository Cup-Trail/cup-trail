-- ============================================================================
-- RLS hardening - revised against the LIVE schema (audited 2026-08-09).
--
-- Findings this fixes:
--   * RLS was OFF on shops, drinks, shop_drinks, shop_drink_categories,
--     categories, and apple_maps_token_cache.
--   * anon + authenticated held ALL privileges (incl. TRUNCATE) on every
--     public table - and TRUNCATE/TRIGGER/REFERENCES are NOT governed by RLS,
--     so grants must be revoked, not just papered over with policies.
--   * reviews had permissive "Anyone can add/update reviews" policies (true).
--   * apple_maps_token_cache (Apple signing JWT + access token) was readable
--     and truncatable by anon.
--
-- Model: reads are public via direct client (SELECT granted + policy); ALL
-- writes go through SECURITY DEFINER rpcs (see 20260809000100). No role other
-- than service_role may write directly. service_role bypasses RLS, so the maps
-- function and the write rpcs keep working.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Drop the permissive legacy review policies.
-- ---------------------------------------------------------------------------
drop policy if exists "Anyone can add reviews" on public.reviews;
drop policy if exists "Anyone can read reviews" on public.reviews;
drop policy if exists "Anyone can update reviews" on public.reviews;

-- ---------------------------------------------------------------------------
-- Enable + force RLS everywhere in public.
-- ---------------------------------------------------------------------------
alter table public.shops                  enable row level security;
alter table public.drinks                 enable row level security;
alter table public.shop_drinks            enable row level security;
alter table public.shop_drink_categories  enable row level security;
alter table public.categories             enable row level security;
alter table public.reviews                enable row level security;
alter table public.users                  enable row level security;
alter table public.apple_maps_token_cache enable row level security;

alter table public.shops                  force row level security;
alter table public.drinks                 force row level security;
alter table public.shop_drinks            force row level security;
alter table public.shop_drink_categories  force row level security;
alter table public.categories             force row level security;
alter table public.reviews                force row level security;
alter table public.users                  force row level security;
alter table public.apple_maps_token_cache force row level security;

-- ---------------------------------------------------------------------------
-- Revoke the blanket grants from anon + authenticated on ALL public tables,
-- then hand back only what the app needs (SELECT on public-read tables).
-- Writes are RPC-only; apple_maps_token_cache is server-only.
-- ---------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'shops','drinks','shop_drinks','shop_drink_categories','categories',
    'reviews','users','apple_maps_token_cache'
  ]
  loop
    execute format('revoke all on public.%I from anon, authenticated;', t);
  end loop;
end $$;

grant select on
  public.shops, public.drinks, public.shop_drinks,
  public.shop_drink_categories, public.categories, public.reviews
  to anon, authenticated;

-- users is read only through its own-row policy; no anon access.
grant select on public.users to authenticated;

-- ---------------------------------------------------------------------------
-- Public read policies. (users already has own-row read/update policies; leave
-- those in place. apple_maps_token_cache gets NO policy → service_role only.)
-- ---------------------------------------------------------------------------
drop policy if exists "public read shops" on public.shops;
create policy "public read shops" on public.shops for select using (true);

drop policy if exists "public read drinks" on public.drinks;
create policy "public read drinks" on public.drinks for select using (true);

drop policy if exists "public read shop_drinks" on public.shop_drinks;
create policy "public read shop_drinks" on public.shop_drinks for select using (true);

drop policy if exists "public read shop_drink_categories" on public.shop_drink_categories;
create policy "public read shop_drink_categories" on public.shop_drink_categories for select using (true);

drop policy if exists "public read categories" on public.categories;
create policy "public read categories" on public.categories for select using (true);

drop policy if exists "public read reviews" on public.reviews;
create policy "public read reviews" on public.reviews for select using (true);
