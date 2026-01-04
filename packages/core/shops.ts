import { supabase } from '@cuptrail/utils';

import type { Result, ShopRow } from './types/types';

const SHOPS_TABLE = 'shops';

export async function getOrInsertShop(
  name: string,
  address: string,
  latitude: number,
  longitude: number,
  image_url: string | null = null,
  archived = false
): Promise<Result<ShopRow>> {
  const { data: existing, error: fetchError } = await supabase
    .from(SHOPS_TABLE)
    .select('*')
    .eq('name', name)
    .eq('address', address)
    .maybeSingle();

  if (fetchError) {
    return {
      success: false,
      source: 'supabase',
      message: fetchError.message,
    };
  }

  if (existing) {
    return { success: true, data: existing as ShopRow };
  }

  const { data: inserted, error: insertError } = await supabase
    .from(SHOPS_TABLE)
    .insert({
      name,
      address,
      latitude,
      longitude,
      image_url,
      archived,
    })
    .select()
    .single();

  if (insertError || !inserted) {
    return {
      success: false,
      source: 'supabase',
      message: insertError?.message ?? 'Insert failed',
    };
  }

  return { success: true, data: inserted as ShopRow };
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

  return { success: true, data: data as ShopRow };
}
