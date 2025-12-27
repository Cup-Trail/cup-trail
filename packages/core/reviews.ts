import { supabase } from '@cuptrail/utils';

import {
  getOrInsertDrink,
  getOrInsertShopDrink,
  updateShopDrink,
} from './drinks';
import type { Result, ReviewRow } from './types/types';

export type ReviewInsertRef = {
  id: string;
  shop_drinks: { id: string };
};

export type ReviewUpdateInput = {
  rating?: number;
  comment?: string;
  media_urls?: string[] | null;
};
const REVIEWS_TABLE = 'reviews';

// Centralize the nested select and normalization so both queries stay in sync
const REVIEW_SELECT = `
  id,
  rating,
  comment,
  media_urls,
  created_at,
  shop_drinks (
    id,
    price,
    drinks (
      id,
      name
    ),
    shops (
      id,
      name
    )
  )
` as const;

/**
 * Get all reviews for a drink at a particular shop.
 * @param {*} shopName
 * @param {*} drinkName
 * @returns
 */
export async function getReviewsByShopAndDrink(
  shopName: string,
  drinkName: string
): Promise<Result<ReviewRow[]>> {
  const { data, error } = await supabase
    .from(REVIEWS_TABLE)
    .select<string, ReviewRow>(REVIEW_SELECT)
    .eq('shop_drinks.drinks.name', drinkName)
    .eq('shop_drinks.shops.name', shopName)
    .order('created_at', { ascending: false });

  if (error) {
    return { success: false, source: 'supabase', message: error.message };
  }

  if (!data?.length) {
    return {
      success: false,
      source: 'supabase',
      message: `No reviews found for ${drinkName} at ${shopName}`,
    };
  }

  return { success: true, data: data };
}
/**
 * Get 10 recent reviews to display on the Home screen.
 * @returns
 */
export async function getRecentReviews(): Promise<Result<ReviewRow[]>> {
  const { data, error } = await supabase
    .from(REVIEWS_TABLE)
    .select<string, ReviewRow>(REVIEW_SELECT)
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    return { success: false, source: 'supabase', message: error.message };
  }

  if (!data?.length) {
    return {
      success: false,
      source: 'supabase',
      message: 'No recent reviews found',
    };
  }

  return { success: true, data: data as ReviewRow[] };
}
/**
 * Insert row into reviews table when the drink exists at the shop. If not,
 * insert a row into the shop_drinks table.
 * @param {*} shopId
 * @param {*} drinkName
 * @param {*} rating - up to 5
 * @param {*} comment
 * @param {*} mediaUrlArr
 * @param {*} userId
 * @returns
 */
export async function insertReview(
  shopId: string,
  drinkName: string,
  rating: number,
  comment: string,
  media_urls?: string[] | null,
  userId?: string | null
): Promise<Result<ReviewInsertRef>> {
  const drink = await getOrInsertDrink(drinkName);
  if (!drink.success) return drink;

  const shopDrink = await getOrInsertShopDrink(shopId, drink.data.id);
  if (!shopDrink.success) return shopDrink;

  const { data, error } = await supabase
    .from(REVIEWS_TABLE)
    .insert({
      user_id: userId ?? null,
      shop_drink_id: shopDrink.data.id,
      rating,
      comment,
      media_urls: media_urls ?? null,
    })
    .select<string, ReviewInsertRef>('id, shop_drinks(id)')
    .single();

  if (error || !data) {
    return {
      success: false,
      source: 'supabase',
      message: error?.message ?? 'Insert failed',
    };
  }

  return { success: true, data };
}

export async function updateReview(
  reviewId: string,
  updates: ReviewUpdateInput
): Promise<
  Result<Pick<ReviewRow, 'id' | 'rating' | 'comment' | 'media_urls'>>
> {
  if (!reviewId) {
    return {
      success: false,
      source: 'client',
      message: 'Missing reviewId',
    };
  }

  const payload = Object.fromEntries(
    Object.entries(updates).filter(([, v]) => v !== undefined)
  );

  if (!Object.keys(payload).length) {
    return {
      success: false,
      source: 'client',
      message: 'No fields to update',
    };
  }

  const { data, error } = await supabase
    .from(REVIEWS_TABLE)
    .update(payload)
    .eq('id', reviewId)
    .select('id, rating, comment, media_urls')
    .single();

  if (error || !data) {
    return {
      success: false,
      source: 'supabase',
      message: error?.message ?? 'Update failed',
    };
  }

  return { success: true, data };
}
export async function calculateAndUpdateAvgRating(
  shopDrinkId: string
): Promise<Result<null>> {
  const { data, error } = await supabase
    .from(REVIEWS_TABLE)
    .select('rating')
    .eq('shop_drink_id', shopDrinkId);

  if (error || !data?.length) {
    return {
      success: false,
      source: 'supabase',
      message: error?.message ?? 'No ratings to aggregate',
    };
  }

  const avg =
    Math.round(
      (data.reduce((sum, r) => sum + r.rating, 0) / data.length) * 10
    ) / 10;

  const result = await updateShopDrink(shopDrinkId, { avg_rating: avg });
  if (!result.success) return result;

  return { success: true, data: null };
}
