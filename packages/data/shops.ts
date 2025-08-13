import { supabase } from './supabaseClient';
const SHOPS_TABLE = 'shops';
import type { Result, Ok, Err } from './types';

/**
 * Minimal shape of a row in the `shops` table.
 * Add/adjust fields if your schema includes more columns.
 */
export interface ShopRow {
  id?: string | number;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  image_url: string | null;
  archived: boolean;
  created_at?: string;
  updated_at?: string;
}

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
    console.error('[Exception]', (err as any)?.message);
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
      console.error('[Supabase Update Error]', error.message);
      return { success: false, source: 'supabase', message: error.message } satisfies Err<ShopRow>;    }

    return { success: true, data: data as ShopRow } satisfies Ok<ShopRow>;  } catch (err) {
    console.error('[Exception]', (err as any)?.message);
    return { success: false, source: 'exception', message: (err as any)?.message ?? 'Unknown error' } satisfies Err<ShopRow>;
  }
}
