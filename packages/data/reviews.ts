import {
  getOrInsertDrink,
  getOrInsertShopDrink,
  updateShopDrink,
} from './drinks';
import { supabase } from './supabaseClient';
import type { Result, Ok, Err } from './types';

export interface ReviewRow {
  id: string;
  rating: number;
  comment: string | null;
  media_urls: string[] | null;
  created_at: string;
  shop_drinks: {
    id: string;
    price: number | null;
    drinks: {
      id?: string;
      name: string;
    };
    shops: {
      id?: string;
      name: string;
    };
  };
}
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

function normalizeReview(row: any): ReviewRow {
  const sd = Array.isArray(row.shop_drinks)
    ? row.shop_drinks[0]
    : row.shop_drinks;
  const d = sd?.drinks && Array.isArray(sd.drinks) ? sd.drinks[0] : sd?.drinks;
  const s = sd?.shops && Array.isArray(sd.shops) ? sd.shops[0] : sd?.shops;
  return {
    id: row.id,
    rating: row.rating,
    comment: row.comment ?? null,
    media_urls: row.media_urls ?? null,
    created_at: row.created_at,
    shop_drinks: {
      id: sd?.id ?? '',
      price: sd?.price ?? null,
      drinks: {
        id: d?.id,
        name: d?.name ?? '',
      },
      shops: {
        id: s?.id,
        name: s?.name ?? '',
      },
    },
  } as ReviewRow;
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
  try {
    const { data, error } = await supabase
      .from(REVIEWS_TABLE)
      .select(REVIEW_SELECT)
      .eq('shop_drinks.drinks.name', drinkName)
      .eq('shop_drinks.shops.name', shopName)
      .order('created_at', { ascending: false });

    if (error) {
      // Silently handle supabase error
      return {
        success: false,
        source: 'supabase',
        message: error.message,
      } satisfies Err<ReviewRow[]>;
    }

    if (!data || data.length === 0) {
      // Silently handle no reviews found
      return {
        success: false,
        source: 'supabase',
        message: `No reviews found for ${drinkName} at ${shopName}`,
      } satisfies Err<ReviewRow[]>;
    }

    const normalized: ReviewRow[] = (data as any[]).map(normalizeReview);

    return { success: true, data: normalized } satisfies Ok<ReviewRow[]>;
  } catch (err) {
    // Log for debugging in development
    if (
      typeof process !== 'undefined' &&
      process.env.NODE_ENV === 'development'
    ) {
      console.error('[Reviews] Exception:', err);
    }

    return {
      success: false,
      source: 'exception',
      message: (err as any)?.message ?? 'Unknown error',
    } satisfies Err<ReviewRow[]>;
  }
}
/**
 * Get 10 recent reviews to display on the Home screen.
 * @returns
 */
export async function getRecentReviews(): Promise<Result<ReviewRow[]>> {
  try {
    const { data, error } = await supabase
      .from(REVIEWS_TABLE)
      .select(REVIEW_SELECT)
      .order('created_at', { ascending: false })
      .limit(10);
    // console.log('[Supabase response]', { data, error }); // Removed for production
    if (error) {
      // Silently handle supabase error
      return {
        success: false,
        source: 'supabase',
        message: error.message,
      } satisfies Err<ReviewRow[]>;
    }

    if (!data || data.length === 0) {
      // Silently handle no recent reviews
      return {
        success: false,
        source: 'supabase',
        message: 'No recent reviews found',
      } satisfies Err<ReviewRow[]>;
    }

    const normalized: ReviewRow[] = (data as any[]).map(normalizeReview);

    return { success: true, data: normalized } satisfies Ok<ReviewRow[]>;
  } catch (err) {
    // Silently handle exception
    return {
      success: false,
      source: 'exception',
      message: (err as any)?.message ?? 'Unknown error',
    } satisfies Err<ReviewRow[]>;
  }
}
/**
 * Insert row into reviews table when the drink exists at the shop. If not,
 * insert a row into the shop_drinks table.
 * @param {*} shopId
 * @param {*} drinkName
 * @param {*} rating - up to 10
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
  mediaUrlArr?: string[] | null,
  userId?: string | null
): Promise<Result<ReviewRow>> {
  try {
    const drinkResult = await getOrInsertDrink(drinkName);
    if (!drinkResult?.success)
      return drinkResult as any satisfies Err<ReviewRow>;

    const shopDrinkResult = await getOrInsertShopDrink(
      shopId,
      drinkResult.data.id
    );
    if (!shopDrinkResult?.success)
      return shopDrinkResult as any satisfies Err<ReviewRow>;

    const { data: inserted, error } = await supabase
      .from(REVIEWS_TABLE)
      .insert({
        user_id: userId ?? null,
        shop_drink_id: shopDrinkResult.data.id,
        rating,
        comment,
        media_urls: mediaUrlArr ?? null,
      })
      .select()
      .single();
    if (error) {
      // Silently handle insert error
      return {
        success: false,
        source: 'supabase',
        message: error.message,
      } satisfies Err<ReviewRow>;
    }

    const avgResult = await calculateAndUpdateAvgRating(
      shopDrinkResult.data.id
    );
    if (!avgResult?.success) return avgResult as any satisfies Err<ReviewRow>;

    if (mediaUrlArr && mediaUrlArr.length > 0) {
      let mediaUrl = null;

      // find first image from recent review
      for (const url of mediaUrlArr) {
        if (url.endsWith('.jpg') || url.endsWith('.jpeg')) {
          mediaUrl = url;
          break;
        }
      }

      // update cover img to a photo from a recent review
      if (mediaUrl) {
        const uploadNewCoverPhoto = await updateShopDrink(
          shopDrinkResult.data.id,
          { cover_photo_url: mediaUrl }
        );
        if (!uploadNewCoverPhoto?.success)
          return uploadNewCoverPhoto as any satisfies Err<ReviewRow>;
      }
    }

    return { success: true, data: inserted } satisfies Ok<ReviewRow>;
  } catch (err) {
    // Log for debugging in development
    if (
      typeof process !== 'undefined' &&
      process.env.NODE_ENV === 'development'
    ) {
      console.error('[Reviews] Insert exception:', err);
    }

    return {
      success: false,
      source: 'exception',
      message: (err as any)?.message ?? 'Unknown error',
    } satisfies Err<ReviewRow>;
  }
}

async function calculateAndUpdateAvgRating(shopDrinkId: string) {
  try {
    const { data, error } = await supabase
      .from(REVIEWS_TABLE)
      .select('rating')
      .eq('shop_drink_id', shopDrinkId);

    if (error) {
      // Silently handle supabase error
      return { success: false, source: 'supabase', message: error.message };
    }

    if (!data?.length) {
      // Silently handle no ratings
      return { success: true };
    }

    const avg =
      Math.round(
        (data.reduce((sum, r) => sum + r.rating, 0) / data.length) * 10
      ) / 10;
    return await updateShopDrink(shopDrinkId, { avg_rating: avg });
  } catch (err) {
    // Log for debugging in development
    if (
      typeof process !== 'undefined' &&
      process.env.NODE_ENV === 'development'
    ) {
      console.error('[Reviews] Calculate avg rating exception:', err);
    }

    return {
      success: false,
      source: 'exception',
      message: (err as any)?.message ?? 'Unknown error',
    };
  }
}
