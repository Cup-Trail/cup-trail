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
export async function fetchShopByName(name) {
  try {
    const { data, error } = await supabase
      .from(SHOPS_TABLE)
      .select('*')
      .eq('name', name)
      .single();

    if (error) throw new Error(error.message);
    if (!data || data.length === 0) {
      console.warn(`"${name}" not found.`);
      return null;
    }
    return data;
  } catch (err) {
    console.error(`Failed to fetch shop "${name}":`, err);
    return null;
  }
}

/**
 * Insert a new shop.
 */
export async function insertShop(
  name,
  address,
  latitude,
  longitude,
  image_url = null,
  archived = false
) {
  try {
    if (!name || !address || name == '' || address == '') {
      console.warn('[Empty Input]');
      return { success: false, code: 'empty' };
    }
    const { error } = await supabase
      .from(SHOPS_TABLE)
      .insert([{ name, address, latitude, longitude, image_url, archived }]);

    if (error) {
      if (error.code === '23505') {
        // 23505 = unique_violation in PostgreSQL
        console.warn('[Duplicate Entry]', error.message);
        return {
          success: false,
          source: 'supabase',
          code: 'duplicate',
          message: 'That shop already exists at this address.',
        };
      }
      console.error('[Supabase Insert Error]', error.message);

      return {
        success: false,
        source: 'supabase',
        message: error.message,
      };
    }

    return { success: true };
  } catch (err) {
    console.error('[Exception]', err.message);
    return { success: false, source: 'exception', message: err.message };
  }
}

/**
 * Soft-delete (archive) a shop by setting `archived = true`.
 */
export async function archiveShop(name) {
  try {
    const { data, error } = await supabase
      .from(SHOPS_TABLE)
      .update({ archived: true })
      .eq('name', name);

    if (error) {
      console.error('[Supabase Update Error]', error.message);
      return {
        success: false,
        source: 'supabase',
        message: error.message,
      };
    }
    return data;
  } catch (err) {
    console.error('[Exception]', err.message);
    return { success: false, source: 'exception', message: err.message };
  }
}
