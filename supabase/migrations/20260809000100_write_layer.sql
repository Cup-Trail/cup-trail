-- ============================================================================
-- Authoritative write layer — DRAFT (reconstructed from application code; not
-- yet verified against the live DB, which was paused at time of writing).
--
-- Depends on 20260809000000_rls_hardening.sql (tables are read-public /
-- write-none for anon+authenticated). These SECURITY DEFINER functions are the
-- ONLY write path. They are called exclusively by the `api` edge function using
-- the service_role key; direct client rpc() calls are revoked below.
--
-- Trust model: the edge function verifies the caller's JWT and passes the
-- verified user id as p_user_id. auth.uid() is NOT used here because these run
-- under service_role (no user JWT context at the DB).
--
-- Assumptions to confirm on resume:
--   * unique(drinks.name) and unique(shop_drinks.shop_id, drink_id) exist
--     (the get-or-create paths below tolerate their absence but race less
--     safely without them).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- avg_rating is DERIVED — recomputed by trigger, never written by clients.
-- ---------------------------------------------------------------------------
create or replace function public.recompute_shop_drink_avg()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_shop_drink_id uuid := coalesce(new.shop_drink_id, old.shop_drink_id);
begin
  update shop_drinks sd
     set avg_rating = coalesce(
           (select round(avg(rating)::numeric, 1) from reviews
             where shop_drink_id = v_shop_drink_id), 0)
   where sd.id = v_shop_drink_id;
  return null;
end;
$$;

drop trigger if exists trg_reviews_recompute_avg on public.reviews;
create trigger trg_reviews_recompute_avg
after insert or delete or update of rating on public.reviews
for each row execute function public.recompute_shop_drink_avg();

-- ---------------------------------------------------------------------------
-- get_or_insert_shop — mirrors packages/core/shops.ts getOrInsertShop.
-- canonical_key is computed client-side (pure fn) and passed in.
-- ---------------------------------------------------------------------------
create or replace function public.get_or_insert_shop(
  p_name text,
  p_address text,
  p_latitude double precision,
  p_longitude double precision,
  p_apple_place_id text,
  p_canonical_key text
)
returns public.shops
language plpgsql
security definer
set search_path = public
as $$
declare
  v_shop public.shops;
begin
  -- 1) prefer apple_place_id
  if p_apple_place_id is not null then
    select * into v_shop from shops where apple_place_id = p_apple_place_id;
    if found then return v_shop; end if;
  end if;

  -- 2) fall back to canonical_key
  select * into v_shop from shops where canonical_key = p_canonical_key;
  if found then
    -- backfill apple_place_id if learned later
    if p_apple_place_id is not null and v_shop.apple_place_id is null then
      update shops set apple_place_id = p_apple_place_id
       where id = v_shop.id returning * into v_shop;
    end if;
    return v_shop;
  end if;

  -- 3) create
  insert into shops (name, address, latitude, longitude, image_url,
                     archived, canonical_key, apple_place_id)
  values (p_name, p_address, p_latitude, p_longitude, null,
          false, p_canonical_key, p_apple_place_id)
  returning * into v_shop;
  return v_shop;
end;
$$;

-- ---------------------------------------------------------------------------
-- archive_shop — soft delete. (Catalog write: any authed caller today; wrap
-- with an admin/ownership check here later without touching the client.)
-- ---------------------------------------------------------------------------
create or replace function public.archive_shop(p_shop_id uuid)
returns public.shops
language plpgsql
security definer
set search_path = public
as $$
declare v_shop public.shops;
begin
  update shops set archived = true where id = p_shop_id returning * into v_shop;
  if not found then raise exception 'shop % not found', p_shop_id; end if;
  return v_shop;
end;
$$;

-- ---------------------------------------------------------------------------
-- submit_review — the core atomic write. Replaces the client-side sequence
-- getOrInsertDrink -> getOrInsertShopDrink -> insert review.
-- avg_rating is handled by the trigger above.
-- ---------------------------------------------------------------------------
create or replace function public.submit_review(
  p_user_id uuid,
  p_shop_id uuid,
  p_drink_name text,
  p_rating numeric,
  p_comment text
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_drink_id uuid;
  v_shop_drink_id uuid;
  v_review_id uuid;
begin
  if p_user_id is null then
    raise exception 'unauthorized' using errcode = '28000';
  end if;
  if p_rating is null or p_rating < 0 or p_rating > 5 then
    raise exception 'rating out of range';
  end if;
  if coalesce(btrim(p_drink_name), '') = '' then
    raise exception 'drink name required';
  end if;

  -- get or create drink
  select id into v_drink_id from drinks where name = p_drink_name;
  if v_drink_id is null then
    insert into drinks (name) values (p_drink_name) returning id into v_drink_id;
  end if;

  -- get or create shop_drink
  select id into v_shop_drink_id
    from shop_drinks where shop_id = p_shop_id and drink_id = v_drink_id;
  if v_shop_drink_id is null then
    insert into shop_drinks (shop_id, drink_id)
    values (p_shop_id, v_drink_id) returning id into v_shop_drink_id;
  end if;

  -- insert review owned by the verified caller (comment is NOT NULL)
  insert into reviews (user_id, shop_drink_id, rating, comment)
  values (p_user_id, v_shop_drink_id, p_rating, coalesce(btrim(p_comment), ''))
  returning id into v_review_id;

  return json_build_object('id', v_review_id, 'shop_drink_id', v_shop_drink_id);
end;
$$;

-- ---------------------------------------------------------------------------
-- update_review — owner-scoped partial update. p_patch may contain any of
-- rating / comment / media_urls (mirrors ReviewUpdateInput).
-- ---------------------------------------------------------------------------
create or replace function public.update_review(
  p_user_id uuid,
  p_review_id uuid,
  p_patch jsonb
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare v_row reviews;
begin
  update reviews r set
    rating = coalesce((p_patch->>'rating')::numeric, r.rating),
    comment = case when p_patch ? 'comment' then p_patch->>'comment' else r.comment end,
    media_urls = case when p_patch ? 'media_urls'
                      then array(select jsonb_array_elements_text(p_patch->'media_urls'))
                      else r.media_urls end
  where r.id = p_review_id and r.user_id = p_user_id
  returning * into v_row;

  if not found then
    raise exception 'review not found or not owned' using errcode = '42501';
  end if;

  return json_build_object(
    'id', v_row.id, 'rating', v_row.rating,
    'comment', v_row.comment, 'media_urls', v_row.media_urls);
end;
$$;

-- ---------------------------------------------------------------------------
-- update_shop_drink_fields — price / cover only. avg_rating is intentionally
-- NOT settable here (trigger owns it).
-- ---------------------------------------------------------------------------
create or replace function public.update_shop_drink_fields(
  p_shop_drink_id uuid,
  p_price numeric default null,
  p_cover_photo_url text default null
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare v_row shop_drinks;
begin
  update shop_drinks sd set
    price = coalesce(p_price, sd.price),
    cover_photo_url = coalesce(p_cover_photo_url, sd.cover_photo_url)
  where sd.id = p_shop_drink_id
  returning * into v_row;

  if not found then raise exception 'shop_drink % not found', p_shop_drink_id; end if;

  return json_build_object(
    'id', v_row.id, 'price', v_row.price,
    'avg_rating', v_row.avg_rating, 'cover_photo_url', v_row.cover_photo_url);
end;
$$;

-- ---------------------------------------------------------------------------
-- set_shop_drink_categories — mirrors categories.ts (replace mappings).
-- ---------------------------------------------------------------------------
create or replace function public.set_shop_drink_categories(
  p_shop_drink_id uuid,
  p_slugs text[]
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from shop_drink_categories where shop_drink_id = p_shop_drink_id;
  if array_length(p_slugs, 1) is not null then
    insert into shop_drink_categories (shop_drink_id, category_id)
    select p_shop_drink_id, c.id from categories c where c.slug = any(p_slugs);
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- Lock down execution: only the edge function (service_role) may call these.
-- ---------------------------------------------------------------------------
do $$
declare fn text;
begin
  foreach fn in array array[
    'get_or_insert_shop(text,text,double precision,double precision,text,text)',
    'archive_shop(uuid)',
    'submit_review(uuid,uuid,text,numeric,text)',
    'update_review(uuid,uuid,jsonb)',
    'update_shop_drink_fields(uuid,numeric,text)',
    'set_shop_drink_categories(uuid,text[])'
  ]
  loop
    execute format('revoke all on function public.%s from public, anon, authenticated;', fn);
    execute format('grant execute on function public.%s to service_role;', fn);
  end loop;
end $$;
