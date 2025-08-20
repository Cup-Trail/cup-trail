import { supabase } from '@cuptrail/utils';

import type { Result, CategoryRow, ShopRow } from './types';

export async function setShopDrinkCategories(
  shopDrinkId: string,
  slugs: string[]
): Promise<Result<null>> {
  // lookup category ids for the slugs
  let cats: CategoryRow[] = [];
  if (slugs.length > 0) {
    const { data, error: catsErr } = await supabase
      .from('categories')
      .select('id, slug')
      .in('slug', slugs);

    if (catsErr)
      return {
        success: false,
        source: 'supabase',
        message: catsErr.message,
      };
    cats = data ?? [];
  }
  // delete existing mappings
  const { error: delErr } = await supabase
    .from('shop_drink_categories')
    .delete()
    .eq('shop_drink_id', shopDrinkId);

  if (delErr)
    return { success: false, source: 'supabase', message: delErr.message };

  // insert new mappings
  if (cats && cats.length) {
    const rows = cats.map(({ id }) => ({
      shop_drink_id: shopDrinkId,
      category_id: id,
    }));
    const { error: insErr } = await supabase
      .from('shop_drink_categories')
      .insert(rows);
    if (insErr)
      return { success: false, source: 'supabase', message: insErr.message };
  }
  // TODO: caching for shop categories
  //   if (shopIdForCache) {
  //     await supabase
  //       .rpc('refresh_shop_categories', { p_shop_id: shopIdForCache })
  //       .catch(() => {});
  //   }

  return { success: true, data: null };
}

// get unique shops that have at least one drink in the given category slug
export async function getShopsByCategorySlug(
  slug: string
): Promise<Result<ShopRow[]>> {
  try {
    const { data, error } = await supabase
      .from('shop_drink_categories')
      .select(
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

    const rows = (data ?? []) as Array<{
      shop_drinks: { shops: ShopRow };
    }>;
    const uniqueMap = new Map<string, ShopRow>();
    for (const row of rows) {
      const shop = row?.shop_drinks?.shops;
      if (shop && shop.id != null) {
        uniqueMap.set(String(shop.id), shop);
      }
    }
    return { success: true, data: Array.from(uniqueMap.values()) };
  } catch (err: any) {
    return {
      success: false,
      source: 'exception',
      message: err?.message ?? 'Unknown error',
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
  } catch (err: any) {
    return {
      success: false,
      source: 'exception',
      message: err?.message ?? 'Unknown error',
    };
  }
}
