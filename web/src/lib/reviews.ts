import { supabase } from './supabase';
import { getOrInsertDrink, getOrInsertShopDrink, updateShopDrink } from './drinks';

const REVIEWS_TABLE = 'reviews';

export async function fetchRecentReviews() {
  const { data, error } = await supabase
    .from(REVIEWS_TABLE)
    .select(`
      id,
      rating,
      comment,
      photo_url,
      created_at,
      shop_drinks (
        id,
        price,
        drinks ( name ),
        shops ( name )
      )
    `)
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) return { success: false, source: 'supabase', message: error.message } as const;
  if (!data?.length) return { success: false, source: 'supabase', code: 'empty', message: 'No recent reviews found' } as const;
  return { success: true, data } as const;
}

export async function insertReview(
  shopId: string,
  drinkName: string,
  rating: number,
  comment: string,
  photoUrl: string | null = null,
  userId: string | null = null
) {
  const drinkResult = await getOrInsertDrink(drinkName);
  if (!('success' in drinkResult) || !drinkResult.success) return drinkResult as any;

  const shopDrinkResult = await getOrInsertShopDrink(shopId, drinkResult.data.id);
  if (!('success' in shopDrinkResult) || !shopDrinkResult.success) return shopDrinkResult as any;

  const { error } = await supabase.from(REVIEWS_TABLE).insert({
    user_id: userId,
    shop_drink_id: shopDrinkResult.data.id,
    rating,
    comment,
    photo_url: photoUrl,
  });
  if (error) return { success: false, source: 'supabase', message: error.message } as const;

  const avgResult = await calculateAndUpdateAvgRating(shopDrinkResult.data.id);
  if (!avgResult.success) return avgResult as any;
  return { success: true } as const;
}

async function calculateAndUpdateAvgRating(shopDrinkId: string) {
  const { data, error } = await supabase
    .from(REVIEWS_TABLE)
    .select('rating')
    .eq('shop_drink_id', shopDrinkId);
  if (error) return { success: false, source: 'supabase', message: error.message } as const;
  if (!data?.length) return { success: true } as const;

  const avg = data.reduce((sum, r) => sum + r.rating, 0) / data.length;
  return updateShopDrink(shopDrinkId, avg);
}


