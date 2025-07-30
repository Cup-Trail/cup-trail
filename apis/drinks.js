import supabase from './supabase';
const DRINKS_TABLE = 'drinks';
const SHOP_DRINKS_TABLE = 'shop_drinks';
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
  ),
  avg_rating
`;

/**
 * Supabase query for shop_drinks, with optional filters.
 * @param {Object} filters - key-value pairs to use as filters
 * @returns {Array|null} - array of rows or null on error
 */
export async function getShopDrinks(filters = {}) {
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
    console.error('getShopDrinks error:', err.message);
    return null;
  }
}

export async function getHighlyRatedDrinks(shopId) {
  try {
    const { data, error } = await supabase
      .from(SHOP_DRINKS_TABLE)
      .select(SHOP_DRINK_SELECT)
      .eq('shop_id', shopId)
      .limit(10)
      .order('avg_rating', { ascending: false });

    if (error) {
      console.error('[Supabase Read Error]', error.message);
      return {
        success: false,
        source: 'supabase',
        message: error.message,
      };
    }

    if (!data || data.length === 0) {
      console.warn(`No rated drinks found at ${shopId}`);
      return {
        success: false,
        source: 'supabase',
        code: 'empty',
        message: `No drink ratings found at ${shopId}`,
      };
    }

    return { success: true, data };
  } catch (err) {
    console.error('[Exception]', err.message);
    return { success: false, source: 'exception', message: err.message };
  }
}

/**
 * Get a specific drink by shop and drink name.
 */
export async function getShopDrinkByName(shopName, drinkName) {
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
      console.error(`[Supabase get Error] ${error.message}`);
      return {
        success: false,
        source: 'supabase',
        message: error.message,
      };
    }

    if (!data) {
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
      `[Exception] Failed to get ${drinkName} at ${shopName}:`,
      err
    );
    return {
      success: false,
      source: 'exception',
      message: err.message,
    };
  }
}
/**
 * Insert a new row into drinks.
 */
export async function getOrInsertDrink(name, tags = null) {
  try {
    const { data: getData, error: getError } = await supabase
      .from(DRINKS_TABLE)
      .select('*')
      .eq('name', name)
      .maybeSingle();
    if (getError)
      return {
        success: false,
        source: 'supabase',
        message: getError.message,
      };

    if (getData) {
      return { success: true, data: getData };
    }
    const { data: insertData, error: insertError } = await supabase
      .from(DRINKS_TABLE)
      .insert([{ name, tags }])
      .select()
      .maybeSingle(); // Return inserted row

    if (insertError) {
      return {
        success: false,
        source: 'supabase',
        message: insertError.message,
      };
    }

    return { success: true, data: insertData };
  } catch (err) {
    console.error('[Exception]', err.message);
    return { success: false, source: 'exception', message: err.message };
  }
}

/**
 * Insert a new row into shop_drinks.
 */
export async function getOrInsertShopDrink(
  shopId,
  drinkId,
  price = null,
  imageUrl = null,
  notes = null,
  avgRating = null
) {
  try {
    const { data: getData, error: getError } = await supabase
      .from(SHOP_DRINKS_TABLE)
      .select('*')
      .eq('shop_id', shopId)
      .eq('drink_id', drinkId)
      .maybeSingle();
    if (getError)
      return {
        success: false,
        source: 'supabase',
        message: getError.message,
      };

    if (getData) {
      // update average rating
      return { success: true, data: getData };
    }
    const { data: insertData, error: insertError } = await supabase
      .from(SHOP_DRINKS_TABLE)
      .insert([
        {
          shop_id: shopId,
          drink_id: drinkId,
          price,
          image_url: imageUrl,
          notes,
          avg_rating: avgRating,
        },
      ])
      .select()
      .maybeSingle(); // Return inserted row

    if (insertError) {
      return {
        success: false,
        source: 'supabase',
        message: insertError.message,
      };
    }

    return { success: true, data: insertData };
  } catch (err) {
    console.error('[Exception]', err.message);
    return { success: false, source: 'exception', message: err.message };
  }
}

export async function updateShopDrink(shopDrinkId, avgRating) {
  try {
    const { error } = await supabase
      .from(SHOP_DRINKS_TABLE)
      .update({ avg_rating: avgRating })
      .eq('id', shopDrinkId);
    if (error) {
      console.error('[updateShopDrink → update]', error.message);
      return { success: false, source: 'supabase', message: error.message };
    }
    return { success: true };
  } catch (err) {
    console.error('[updateShopDrink → exception]', err.message);
    return { success: false, source: 'exception', message: err.message };
  }
}
