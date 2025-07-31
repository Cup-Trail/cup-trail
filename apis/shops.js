import supabase from './supabase';

const SHOPS_TABLE = 'shops';

/**
 * Get a shop's information or insert a new shop if it doesn't exist.
 */
export async function getOrInsertShop(
  name,
  address,
  latitude,
  longitude,
  image_url = null,
  archived = false
) {
  try {
    const { data: getData, error: getError } = await supabase
      .from(SHOPS_TABLE)
      .select('*')
      .eq('name', name)
      .eq('address', address)
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
      .from(SHOPS_TABLE)
      .insert([{ name, address, latitude, longitude, image_url, archived }])
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
    if (data) {
      return { success: true, data };
    }
  } catch (err) {
    console.error('[Exception]', err.message);
    return { success: false, source: 'exception', message: err.message };
  }
}
