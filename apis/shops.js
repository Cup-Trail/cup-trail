import supabase from './supabase';

const SHOPS_TABLE = 'shops';

/**
 * Fetch all shops.
 */
export async function fetchShops() {
  try {
    const { data, error } = await supabase.from(SHOPS_TABLE).select('*');
    if (error) throw new Error(error.message);
    if (!data || data.length === 0) {
      console.warn(`No shops found".`);
      return null;
    }
    return data;
  } catch (err) {
    console.error('Failed to fetch shops:', err);
    return null;
  }
}

/**
 * Fetch a shop by name.
 */
export async function fetchShopByName(shopName) {
  try {
    const { data, error } = await supabase
      .from(SHOPS_TABLE)
      .select('*')
      .eq('name', shopName)
      .single();

    if (error) throw new Error(error.message);
    if (!data || data.length === 0) {
      console.warn(`"${shopName}" not found.`);
      return null;
    }
    return data;
  } catch (err) {
    console.error(`Failed to fetch shop "${shopName}":`, err);
    return null;
  }
}

/**
 * Insert a new shop.
 */
export async function insertShop(
  shopName,
  address,
  latitude = null,
  longitude = null,
  image_url = null
) {
  try {
    const { data, error } = await supabase
      .from(SHOPS_TABLE)
      .insert([{ shopName, address, latitude, longitude, image_url }]);

    if (error) throw new Error(error.message);
    return data;
  } catch (err) {
    console.error('Failed to insert shop:', err);
    return null;
  }
}

/**
 * Soft-delete (archive) a shop by setting `archived = true`.
 */
export async function archiveShop(shopName) {
  try {
    const { data, error } = await supabase
      .from(SHOPS_TABLE)
      .update({ archived: true })
      .eq('name', shopName);

    if (error) throw new Error(error.message);
    return data;
  } catch (err) {
    console.error(`Failed to archive shop "${shopName}":`, err);
    return null;
  }
}
