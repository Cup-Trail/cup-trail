import { supabase } from '@cuptrail/utils';

import { apiWritePut } from './apiClient';
import type { CategoryRow, Result, ShopRow, ShopsByCategory } from './types';

// The slug lookup + replace-mappings transaction runs in the
// `set_shop_drink_categories` rpc.
export async function setShopDrinkCategories(
  shopDrinkId: string,
  slugs: string[]
): Promise<Result<null>> {
  const res = await apiWritePut<{ ok: boolean }>(
    `/shop-drinks/${shopDrinkId}/categories`,
    { slugs }
  );
  if (!res.success) return res;
  return { success: true, data: null };
}

// get unique shops that have at least one drink in the given category slug
export async function getShopsByCategorySlug(
  slug: string
): Promise<Result<ShopRow[]>> {
  try {
    const { data, error } = await supabase
      .from('shop_drink_categories')
      .select<string, ShopsByCategory>(
        `
        shop_drinks:shop_drinks!inner (
          shops:shops!inner (
            id,
            name,
            address,
            latitude,
            longitude,
            image_url,
            archived
          )
        ),
        categories:categories!inner (slug)
      `
      )
      .eq('categories.slug', slug);

    if (error) {
      return { success: false, source: 'supabase', message: error.message };
    }

    const rows = (data ?? []) as Array<ShopsByCategory>;
    const uniqueMap = new Map<string, ShopRow>();
    for (const row of rows) {
      const shop = row?.shop_drinks?.shops;
      if (shop && shop.id != null) {
        uniqueMap.set(String(shop.id), shop);
      }
    }
    return { success: true, data: Array.from(uniqueMap.values()) };
  } catch (err: unknown) {
    return {
      success: false,
      source: 'exception',
      message: err instanceof TypeError ? err.message : 'Unknown error',
    };
  }
}

// fetch up to 20 categories ordered by sort_order ascending
export async function getCategories(
  limit = 20
): Promise<Result<CategoryRow[]>> {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('id, slug, label, sort_order')
      .order('sort_order', { ascending: true })
      .limit(limit);

    if (error) {
      return { success: false, source: 'supabase', message: error.message };
    }

    return { success: true, data: (data ?? []) as CategoryRow[] };
  } catch (err: unknown) {
    return {
      success: false,
      source: 'exception',
      message: err instanceof TypeError ? err?.message : 'Unknown error',
    };
  }
}
