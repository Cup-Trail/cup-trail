import supabase from './supabase';
const REVIEWS_TABLE = 'reviews';

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
    if (!data || data.length === 0) {
      console.warn(`No reviews found for "${drinkName}" at "${shopName}".`);
      return null;
    }

    if (error) throw new Error(error.message);
    return data;
  } catch (err) {
    console.error(
      `Failed to fetch reviews for "${drinkName}" at "${shopName}":`,
      err
    );
    return null;
  }
}

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

    if (!data || data.length === 0) {
      console.warn(`No recent reviews found.`);
      return {
        success: false,
        source: 'supabase',
        code: 'empty',
        message: 'No recent reviews found',
      };
    }

    if (error) {
      console.error('[Supabase Read Error]', error.message);
      return {
        success: false,
        source: 'supabase',
        message: error.message,
      };
    }

    return { success: true, data };
  } catch (err) {
    console.error('[JavaScript Exception]', err.message);
    return { success: false, source: 'exception', message: err.message };
  }
}
