import supabase from './supabase';

const SHOP_DRINK_SELECT = `
  id,
  price,
  notes,
  drinks (
    id,
    name,
    tags
  ),
  shops (
    id,
    name
  )
`;

/**
 * Supabase query for shop_drinks, with optional filters.
 * @param {Object} filters - key-value pairs to use as filters
 * @returns {Array|null} - array of rows or null on error
 */
async function fetchShopDrinks(filters = {}) {
  try {
    let query = supabase.from('shop_drinks').select(SHOP_DRINK_SELECT);

    // add filters
    for (const [key, value] of Object.entries(filters)) {
      query = query.eq(key, value);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    return data;
  } catch (err) {
    console.error('fetchShopDrinks error:', err.message);
    return null;
  }
}

/**
 * Fetch all drinks for a given shop.
 */
export async function fetchDrinks(shopName) {
  const data = await fetchShopDrinks({ 'shops.name': shopName });
  if (!data || data.length === 0) {
    console.warn(`No drinks found at "${shopName}".`);
    return null;
  }
  return data;
}

/**
 * Fetch a specific drink by shop and drink name.
 */
export async function fetchShopDrinkByName(shopName, drinkName) {
  try {
    const { data, error } = await supabase
      .from(SHOP_DRINKS_TABLE)
      .select(
        `
        id,
        drinks(name),
        shops(name)
      `
      )
      .eq('drinks.name', drinkName)
      .eq('shops.name', shopName)
      .maybeSingle(); // returns in {} shape instead of arr
    if (error) {
      console.error(`[Supabase Fetch Error] ${error.message}`);
      return {
        success: false,
        source: 'supabase',
        message: error.message,
      };
    }

    if (!data || data.length === 0) {
      return {
        success: false,
        code: 'not_found',
        source: 'app',
        message: `${drinkName} at ${shopName} not found.`,
      };
    }

    return { success: true, data };
  } catch (err) {
    console.error(
      `[Exception] Failed to fetch ${drinkName} at ${shopName}:`,
      err
    );
    return {
      success: false,
      source: 'exception',
      message: err.message,
    };
  }
}
