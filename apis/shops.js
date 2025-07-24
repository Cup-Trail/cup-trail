import supabase from './supabase';

const SHOPS_TABLE = 'shops';

/**
 * Insert a new shop.
 */
export async function fetchOrInsertShop(
  name,
  address,
  latitude,
  longitude,
  image_url = null,
  archived = false
) {
  try {
    // if (!name || !address || name == '' || address == '') {
    //   console.warn('[Empty Input]');
    //   return { success: false, code: 'empty' };
    // }
    const { data: fetchData, error: fetchError } = await supabase
      .from(SHOPS_TABLE)
      .select('*')
      .eq('name', name)
      .eq('address', address)
      .maybeSingle();
    if (fetchError)
      return {
        success: false,
        source: 'supabase',
        message: fetchError.message,
      };

    if (fetchData) {
      return { success: true, data: fetchData };
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
    return data;
  } catch (err) {
    console.error('[Exception]', err.message);
    return { success: false, source: 'exception', message: err.message };
  }
}
