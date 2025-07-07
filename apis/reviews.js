import { supabase } from './supabase';

export async function fetchReviewsByShopAndDrink(shopName, drinkName) {
  try {
    const { data, error } = await supabase
      .from('reviews')
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
        ),
        user:auth.users (
          id,
          email
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
