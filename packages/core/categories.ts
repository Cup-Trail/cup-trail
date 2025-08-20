import { supabase } from '@cuptrail/utils';

import type { Result, CategoryRow } from './types';

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
