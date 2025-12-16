import { supabase } from '@cuptrail/utils';
import type { DrinkRow, Result, ShopDrinkRow } from './types/types';

const DRINKS_TABLE = 'drinks';
const SHOP_DRINKS_TABLE = 'shop_drinks';

const SHOP_DRINK_SELECT = `
  id,
  price,
  avg_rating,
  cover_photo_url,
  drinks ( id, name ),
  shops ( id, name )
`;

export async function getHighlyRatedDrinks(
  shopId: string
): Promise<Result<ShopDrinkRow[]>> {
  const { data, error } = await supabase
    .from(SHOP_DRINKS_TABLE)
    .select(SHOP_DRINK_SELECT)
    .eq('shop_id', shopId)
    .order('avg_rating', { ascending: false })
    .limit(10);

  if (error) {
    return { success: false, source: 'supabase', message: error.message };
  }

  if (!data || data.length === 0) {
    return {
      success: false,
      source: 'supabase',
      message: `No drink ratings found at ${shopId}`,
    };
  }

  return { success: true, data: data as ShopDrinkRow[] };
}

export async function getShopDrinkByName(
  shopName: string,
  drinkName: string
): Promise<Result<ShopDrinkRow>> {
  const { data, error } = await supabase
    .from(SHOP_DRINKS_TABLE)
    .select(SHOP_DRINK_SELECT)
    .eq('drinks.name', drinkName)
    .eq('shops.name', shopName)
    .maybeSingle();

  if (error) {
    return { success: false, source: 'supabase', message: error.message };
  }

  if (!data) {
    return {
      success: false,
      source: 'supabase',
      message: `${drinkName} at ${shopName} not found`,
    };
  }

  return { success: true, data: data as ShopDrinkRow };
}

export async function getOrInsertDrink(
  name: string
): Promise<Result<DrinkRow>> {
  const { data, error } = await supabase
    .from(DRINKS_TABLE)
    .select('*')
    .eq('name', name)
    .maybeSingle();

  if (error) {
    return { success: false, source: 'supabase', message: error.message };
  }

  if (data) {
    return { success: true, data: data as DrinkRow };
  }

  const { data: inserted, error: insertError } = await supabase
    .from(DRINKS_TABLE)
    .insert({ name })
    .select()
    .single();

  if (insertError) {
    return {
      success: false,
      source: 'supabase',
      message: insertError.message,
    };
  }

  return { success: true, data: inserted as DrinkRow };
}

export async function getOrInsertShopDrink(
  shopId: string,
  drinkId: string,
  price: number | null = null
): Promise<Result<ShopDrinkRow>> {
  const { data, error } = await supabase
    .from(SHOP_DRINKS_TABLE)
    .select(SHOP_DRINK_SELECT)
    .eq('shop_id', shopId)
    .eq('drink_id', drinkId)
    .maybeSingle();

  if (error) {
    return { success: false, source: 'supabase', message: error.message };
  }

  if (data) {
    return { success: true, data: data as ShopDrinkRow };
  }

  const { data: inserted, error: insertError } = await supabase
    .from(SHOP_DRINKS_TABLE)
    .insert({ shop_id: shopId, drink_id: drinkId, price })
    .select(SHOP_DRINK_SELECT)
    .single();

  if (insertError) {
    return {
      success: false,
      source: 'supabase',
      message: insertError.message,
    };
  }

  return { success: true, data: inserted as ShopDrinkRow };
}

export async function updateShopDrink(
  shopDrinkId: string,
  updates: Partial<
    Pick<ShopDrinkRow, 'price' | 'avg_rating' | 'cover_photo_url'>
  >
): Promise<Result<ShopDrinkRow>> {
  const { data, error } = await supabase
    .from(SHOP_DRINKS_TABLE)
    .update(updates)
    .eq('id', shopDrinkId)
    .select(SHOP_DRINK_SELECT)
    .single();

  if (error || !data) {
    return {
      success: false,
      source: 'supabase',
      message: error?.message ?? 'Update failed',
    };
  }

  return { success: true, data: data as ShopDrinkRow };
}
export function pickCoverPhotoFromMedia(mediaUrls: string[]): string | null {
  if (!mediaUrls || mediaUrls.length === 0) return null;

  // Prefer images
  const image = mediaUrls.find(url => /\.(jpe?g|png|webp)$/i.test(url));

  return image ?? mediaUrls[0] ?? null;
}
export async function updateShopDrinkCoverFromMedia(
  shopDrinkId: string,
  mediaUrls: string[]
): Promise<Result<ShopDrinkRow | null>> {
  const cover = pickCoverPhotoFromMedia(mediaUrls);

  // Nothing to update
  if (!cover) {
    return { success: true, data: null };
  }

  return updateShopDrink(shopDrinkId, {
    cover_photo_url: cover,
  });
}
