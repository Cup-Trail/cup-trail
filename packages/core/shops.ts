import { supabase } from './supabaseClient';
const SHOPS_TABLE = 'shops';
import type { Result, Ok, Err, ShopRow } from './types';

// ShopRow type is now imported from ./types

export async function getOrInsertShop(
  name: string,
  address: string,
  latitude: number,
  longitude: number,
  image_url: string | null = null,
  archived: boolean = false
): Promise<Result<ShopRow>> {
  try {
    const { data: getData, error: getError } = await supabase
      .from(SHOPS_TABLE)
      .select('*')
      .eq('name', name)
      .eq('address', address)
      .maybeSingle();

    if (getError) {
      return {
        success: false,
        source: 'supabase',
        message: getError.message,
      } satisfies Err<ShopRow>;
    }

    if (getData) {
      return { success: true, data: getData } satisfies Ok<ShopRow>;
    }

    const { data: insertData, error: insertError } = await supabase
      .from(SHOPS_TABLE)
      .insert([{ name, address, latitude, longitude, image_url, archived }])
      .select()
      .maybeSingle();

    if (insertError) {
      return {
        success: false,
        source: 'supabase',
        message: insertError.message,
      } satisfies Err<ShopRow>;
    }

    return { success: true, data: insertData as ShopRow } satisfies Ok<ShopRow>;
  } catch (err) {
    // Log for debugging in development
    if (
      typeof process !== 'undefined' &&
      process.env.NODE_ENV === 'development'
    ) {
      console.error('[Shops] Exception:', err);
    }

    return {
      success: false,
      source: 'exception',
      message: (err as any)?.message ?? 'Unknown error',
    } satisfies Err<ShopRow>;
  }
}

/**
 * Soft-delete (archive) a shop by setting `archived = true`.
 */
export async function archiveShop(name: string): Promise<Result<ShopRow>> {
  try {
    const { data, error } = await supabase
      .from(SHOPS_TABLE)
      .update({ archived: true })
      .eq('name', name)
      .select()
      .maybeSingle();

    if (error) {
      // Silently handle supabase error
      return {
        success: false,
        source: 'supabase',
        message: error.message,
      } satisfies Err<ShopRow>;
    }

    return { success: true, data: data as ShopRow } satisfies Ok<ShopRow>;
  } catch (err) {
    // Silently handle exception
    return {
      success: false,
      source: 'exception',
      message: (err as any)?.message ?? 'Unknown error',
    } satisfies Err<ShopRow>;
  }
}
