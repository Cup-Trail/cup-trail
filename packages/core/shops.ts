import { supabase } from '@cuptrail/utils';
import { makeCanonicalKey } from '../utils/canonical';
import type { Result, ShopRow } from './types/types';

const SHOPS_TABLE = 'shops';

/**
 * Retrieves an existing shop or inserts a new one if it does not exist.
 *
 * Lookup / insert priority:
 * 1) If `apple_place_id` is provided, treat it as the primary unique key:
 *    - try fetch by apple_place_id
 *    - if not found, upsert using onConflict: apple_place_id
 * 2) Otherwise (or if apple lookup fails to find), fall back to canonical_key:
 *    - try fetch by canonical_key
 *    - if not found, upsert using onConflict: canonical_key
 *
 * Notes:
 * - Suite/unit is preserved because we use the full formatted `address` string.
 * - We backfill `apple_place_id` onto an existing canonical match when learned.
 */
export async function getOrInsertShop(
  name: string,
  address: string,
  latitude: number,
  longitude: number,
  apple_place_id?: string | null
): Promise<Result<ShopRow>> {
  const canonical_key = makeCanonicalKey(name, address);

  // 1) Prefer apple_place_id when available
  if (apple_place_id) {
    // fast path: fetch
    const { data: byApple, error: appleErr } = await supabase
      .from(SHOPS_TABLE)
      .select<string, ShopRow>('*')
      .eq('apple_place_id', apple_place_id)
      .maybeSingle();

    if (appleErr) {
      return { success: false, source: 'supabase', message: appleErr.message };
    }
    if (byApple) return { success: true, data: byApple };

    // not found: upsert on apple_place_id (dedupes concurrent inserts)
    const { data: upsertedByApple, error: upsertAppleErr } = await supabase
      .from(SHOPS_TABLE)
      .upsert(
        {
          name,
          address,
          latitude,
          longitude,
          image_url: null,
          archived: false,
          canonical_key,
          apple_place_id,
        },
        { onConflict: 'apple_place_id' }
      )
      .select()
      .single();

    if (!upsertAppleErr && upsertedByApple) {
      return { success: true, data: upsertedByApple as ShopRow };
    }

    // If apple upsert failed (e.g., due to other unique constraints),
    // fall through to canonical logic below.
  }

  // 2) Fallback: canonical_key fetch
  const { data: byCanon, error: canonErr } = await supabase
    .from(SHOPS_TABLE)
    .select<string, ShopRow>('*')
    .eq('canonical_key', canonical_key)
    .maybeSingle();

  if (canonErr) {
    return { success: false, source: 'supabase', message: canonErr.message };
  }

  if (byCanon) {
    // backfill apple_place_id if we learned it later
    if (apple_place_id && !byCanon.apple_place_id) {
      const { error: backfillErr } = await supabase
        .from(SHOPS_TABLE)
        .update({ apple_place_id })
        .eq('id', byCanon.id);

      if (backfillErr) {
        console.warn('Failed to backfill apple_place_id:', backfillErr.message);
      }
    }
    return { success: true, data: byCanon };
  }

  // 3) Not found: upsert on canonical_key (dedupes concurrent inserts)
  const { data: upsertedByCanon, error: upsertCanonErr } = await supabase
    .from(SHOPS_TABLE)
    .upsert(
      {
        name,
        address,
        latitude,
        longitude,
        image_url: null,
        archived: false,
        canonical_key,
        apple_place_id: apple_place_id ?? null,
      },
      { onConflict: 'canonical_key' }
    )
    .select()
    .single();

  if (upsertCanonErr || !upsertedByCanon) {
    // last-resort: if apple_place_id exists, try returning the row by it
    if (apple_place_id) {
      const { data: existingByApple } = await supabase
        .from(SHOPS_TABLE)
        .select<string, ShopRow>('*')
        .eq('apple_place_id', apple_place_id)
        .maybeSingle();

      if (existingByApple) return { success: true, data: existingByApple };
    }

    return {
      success: false,
      source: 'supabase',
      message: upsertCanonErr?.message ?? 'Upsert failed',
    };
  }

  return { success: true, data: upsertedByCanon as ShopRow };
}

/**
 * Fetch a single shop by primary key from Postgres.
 *
 * - Returns `{ success: true, data: ShopRow }` if the shop exists
 * - Returns `{ success: true, data: null }` if no shop is found
 * - Returns `{ success: false, message }` if a database or network error occurs
 *
 * @param shop_id - UUID of the shop to fetch
 * @returns Result containing the shop record or null
 */
export async function getShopById(
  shop_id: string
): Promise<Result<ShopRow | null>> {
  const { data: shop, error } = await supabase
    .from(SHOPS_TABLE)
    .select<string, ShopRow>('*')
    .eq('id', shop_id)
    .maybeSingle();

  // postgres error
  if (error) {
    return {
      success: false,
      source: 'supabase',
      message: error.message,
    };
  }
  // fetch successful; return shop details or null data
  return {
    success: true,
    data: shop ?? null,
  };
}

/**
 * Soft-delete (archive) a shop by setting `archived = true`.
 */
export async function archiveShop(shopId: string): Promise<Result<ShopRow>> {
  const { data, error } = await supabase
    .from(SHOPS_TABLE)
    .update({ archived: true })
    .eq('id', shopId)
    .select()
    .single();

  if (error || !data) {
    return {
      success: false,
      source: 'supabase',
      message: error?.message ?? 'Archive failed',
    };
  }

  return { success: true, data: data };
}
