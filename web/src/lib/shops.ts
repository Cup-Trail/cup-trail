import { supabase } from './supabase';

const SHOPS_TABLE = 'shops';

export async function fetchOrInsertShop(
  name: string,
  address: string,
  latitude: number,
  longitude: number,
  image_url: string | null = null,
  archived = false
) {
  const { data: getData, error: getError } = await supabase
    .from(SHOPS_TABLE)
    .select('*')
    .eq('name', name)
    .eq('address', address)
    .maybeSingle();
  if (getError) return { success: false, source: 'supabase', message: getError.message } as const;
  if (getData) return { success: true, data: getData } as const;

  const { data: insertData, error: insertError } = await supabase
    .from(SHOPS_TABLE)
    .insert([{ name, address, latitude, longitude, image_url, archived }])
    .select()
    .maybeSingle();
  if (insertError) return { success: false, source: 'supabase', message: insertError.message } as const;
  return { success: true, data: insertData } as const;
}


