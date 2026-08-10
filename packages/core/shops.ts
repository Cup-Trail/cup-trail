import { supabase } from '@cuptrail/utils';

import { makeCanonicalKey } from '../utils/canonical';

import { apiWritePost } from './apiClient';
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
  // The apple_place_id / canonical_key get-or-create + backfill logic now runs
  // atomically in the `get_or_insert_shop` rpc. canonical_key is a pure
  // client-side derivation so we still compute it here and pass it through.
  const canonical_key = makeCanonicalKey(name, address);

  return apiWritePost<ShopRow>('/shops', {
    name,
    address,
    latitude,
    longitude,
    applePlaceId: apple_place_id ?? null,
    canonicalKey: canonical_key,
  });
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
  return apiWritePost<ShopRow>(`/shops/${shopId}/archive`, {});
}
