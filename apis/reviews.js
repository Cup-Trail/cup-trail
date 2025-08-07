import {
  getOrInsertDrink,
  getOrInsertShopDrink,
  updateShopDrink,
} from './drinks';
import supabase from './supabase';

const REVIEWS_TABLE = 'reviews';

/**
 * Get all reviews for a drink at a particular shop.
 * @param {*} shopName
 * @param {*} drinkName
 * @returns
 */
export async function getReviewsByShopAndDrink(shopName, drinkName) {
  try {
    const { data, error } = await supabase
      .from(REVIEWS_TABLE)
      .select(
        `
        id,
        rating,
        comment,
        photo_url,
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
      `
      )
      .eq('shop_drinks.drinks.name', drinkName)
      .eq('shop_drinks.shops.name', shopName)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Supabase Read Error]', error.message);
      return {
        success: false,
        source: 'supabase',
        message: error.message,
      };
    }

    if (!data || data.length === 0) {
      console.warn(`No reviews found for ${drinkName} at ${shopName}`);
      return {
        success: false,
        source: 'supabase',
        code: 'empty',
        message: `No reviews found for ${drinkName} at ${shopName}`,
      };
    }

    return { success: true, data };
  } catch (err) {
    console.error('[Exception]', err.message);
    return { success: false, source: 'exception', message: err.message };
  }
}
/**
 * Get 10 recent reviews to display on the Home screen.
 * @returns
 */
export async function getRecentReviews() {
  try {
    const { data, error } = await supabase
      .from(REVIEWS_TABLE)
      .select(
        `
            id,
            rating,
            comment,
            media_urls,
            created_at,
            shop_drinks (
              id,
              price,
              drinks (
                name
              ),
              shops (
                name
              )
            )
          `
      )
      .order('created_at', { ascending: false })
      .limit(10);
    console.log('[Supabase response]', { data, error });

    if (error) {
      console.error('[Supabase Read Error]', error.message);
      return {
        success: false,
        source: 'supabase',
        message: error.message,
      };
    }

    if (!data || data.length === 0) {
      console.warn(`No recent reviews found.`);
      return {
        success: false,
        source: 'supabase',
        code: 'empty',
        message: 'No recent reviews found',
      };
    }

    return { success: true, data };
  } catch (err) {
    console.error('[Exception]', err.message);
    return { success: false, source: 'exception', message: err.message };
  }
}
/**
 * Insert row into reviews table when the drink exists at the shop. If not,
 * insert a row into the shop_drinks table.
 * @param {*} shopName
 * @param {*} drinkName
 * @param {*} rating - up to 10
 * @param {*} comment
 * @param {*} mediaUrl
 * @param {*} userId
 * @returns
 */
export async function insertReview(
  shopId,
  drinkName,
  rating,
  comment,
  mediaUrlArr = null,
  userId = null
) {
  try {
    const drinkResult = await getOrInsertDrink(drinkName);
    if (!drinkResult?.success) return drinkResult;

    const shopDrinkResult = await getOrInsertShopDrink(
      shopId,
      drinkResult.data.id
    );
    if (!shopDrinkResult?.success) return shopDrinkResult;

    const { error } = await supabase.from(REVIEWS_TABLE).insert({
      user_id: userId,
      shop_drink_id: shopDrinkResult.data.id,
      rating,
      comment,
      media_urls: mediaUrlArr,
    });
    if (error) {
      console.error('[insertReview → insert]', error.message);
      return { success: false, source: 'supabase', message: error.message };
    }

    const avgResult = await calculateAndUpdateAvgRating(
      shopDrinkResult.data.id
    );
    console.log('avgResult', avgResult);
    if (!avgResult?.success) return avgResult;

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
        if (!uploadNewCoverPhoto?.success) return uploadNewCoverPhoto;
      }
    }

    return { success: true };
  } catch (err) {
    console.error('[insertReview → exception]', err.message);
    return { success: false, source: 'exception', message: err.message };
  }
}

async function calculateAndUpdateAvgRating(shopDrinkId) {
  try {
    const { data, error } = await supabase
      .from(REVIEWS_TABLE)
      .select('rating')
      .eq('shop_drink_id', shopDrinkId);

    if (error) {
      console.error('[calculateAndUpdateAvgRating → get]', error.message);
      return { success: false, source: 'supabase', message: error.message };
    }

    if (!data?.length) {
      console.warn(
        `[calculateAndUpdateAvgRating] No ratings for ${shopDrinkId}`
      );
      return { success: true };
    }

    const avg =
      Math.round(
        (data.reduce((sum, r) => sum + r.rating, 0) / data.length) * 100
      ) / 100;
    return await updateShopDrink(shopDrinkId, { avg_rating: avg });
  } catch (err) {
    console.error('[calculateAndUpdateAvgRating → exception]', err.message);
    return { success: false, source: 'exception', message: err.message };
  }
}
