import { supabase } from '@cuptrail/utils';

import { apiWritePatch, apiWritePost } from './apiClient';
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
  user_id,
  rating,
  comment,
  media_urls,
  created_at,
  shop_drinks!inner (
    id,
    price,
    avg_rating,
    drinks!inner (
      id,
      name
    ),
    shops!inner (
      id,
      name,
      address
    )
  )
` as const;

/**
 * Get all review made by a user
 */
export async function getReviewsByUser(
  userId: string
): Promise<Result<ReviewRow[]>> {
  const { data, error } = await supabase
    .from(REVIEWS_TABLE)
    .select<string, ReviewRow>(REVIEW_SELECT)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    return { success: false, source: 'supabase', message: error.message };
  }

  return { success: true, data: data };
}
/**
 * Get all reviews on a shop
 */
export async function getReviewsByShop(
  shopId: string
): Promise<Result<ReviewRow[]>> {
  const { data, error } = await supabase
    .from(REVIEWS_TABLE)
    .select<string, ReviewRow>(REVIEW_SELECT)
    .eq('shop_drinks.shops.id', shopId)
    .order('created_at', { ascending: false });

  if (error) {
    return { success: false, source: 'supabase', message: error.message };
  }

  return { success: true, data: data };
}
/**
 * Get all review made by a user at a shop
 */
export async function getReviewsByUserShop(
  userId: string,
  shopId: string
): Promise<Result<ReviewRow[]>> {
  const { data, error } = await supabase
    .from(REVIEWS_TABLE)
    .select<string, ReviewRow>(REVIEW_SELECT)
    .eq('user_id', userId)
    .eq('shop_drinks.shops.id', shopId)
    .order('created_at', { ascending: false });

  if (error) {
    return { success: false, source: 'supabase', message: error.message };
  }

  return { success: true, data: data };
}

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
// The drink + shop_drink creation, ownership, and avg_rating recompute all
// happen atomically server-side in the `submit_review` rpc. `media_urls` and
// `userId` are accepted for signature compatibility but ignored: media is
// attached afterward via updateReview, and the owner is derived from the JWT.
export async function insertReview(
  shopId: string,
  drinkName: string,
  rating: number,
  comment: string,
  _media_urls?: string[] | null,
  _userId?: string | null
): Promise<Result<ReviewInsertRef>> {
  return apiWritePost<ReviewInsertRef>('/reviews', {
    shopId,
    drinkName,
    rating,
    comment,
  });
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

  // Ownership (user_id = caller) is enforced by the `update_review` rpc.
  return apiWritePatch<
    Pick<ReviewRow, 'id' | 'rating' | 'comment' | 'media_urls'>
  >(`/reviews/${reviewId}`, payload);
}

// avg_rating is now recomputed by a DB trigger whenever reviews change, so this
// is a no-op kept for signature compatibility with existing callers.
export async function calculateAndUpdateAvgRating(
  _shopDrinkId: string
): Promise<Result<null>> {
  return { success: true, data: null };
}
