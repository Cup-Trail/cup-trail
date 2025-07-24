import supabase from './supabase';
import { fetchShopDrinkByName } from './drinks';

const REVIEWS_TABLE = 'reviews';

/**
 * Fetch all reviews for a drink at a particular shop.
 * @param {*} shopName
 * @param {*} drinkName
 * @returns
 */
export async function fetchReviewsByShopAndDrink(shopName, drinkName) {
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
 * Fetch 10 recent reviews to display on the Home screen.
 * @returns
 */
export async function fetchRecentReviews() {
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
 * @param {*} photoUrl
 * @param {*} userId
 * @returns
 */
export async function insertReview(
  shopName,
  drinkName,
  rating,
  comment,
  photoUrl = null,
  userId = null
) {
  try {
    const result = await fetchShopDrinkByName(shopName, drinkName);

    if (!result.success) {
      console.warn('Fetch failed:', result.message);
      if (result.code === 'not_found') {
        // add shop_drink insert func here
      }
      return {
        success: false,
        source: result.source,
        message: result.message,
        code: result.code,
      };
    }
    console.log('Fetched row:', result.data);
    const { error } = await supabase.from(REVIEWS_TABLE).insert({
      user_id: userId,
      shop_drink_id: result.data.id,
      rating,
      comment,
      photo_url: photoUrl,
    });
    if (error) {
      console.error('[Supabase Insert Error]', error.message);
      return { success: false, source: 'supabase', message: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error('[JavaScript Exception]', err.message);
    return { success: false, source: 'exception', message: err.message };
  }
}
