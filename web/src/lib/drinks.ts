import { supabase } from './supabase';

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

export async function fetchHighlyRatedDrinks(shopId: string) {
  try {
    const { data, error } = await supabase
      .from(SHOP_DRINKS_TABLE)
      .select(SHOP_DRINK_SELECT)
      .eq('shop_id', shopId)
      .limit(10)
      .order('avg_rating', { ascending: false });

    if (error) return { success: false, source: 'supabase', message: error.message } as const;
    if (!data?.length) return { success: false, source: 'supabase', code: 'empty', message: `No drink ratings found at ${shopId}` } as const;
    return { success: true, data } as const;
  } catch (err: any) {
    return { success: false, source: 'exception', message: err.message } as const;
  }
}

export async function getOrInsertDrink(name: string, tags: string[] | null = null) {
  const { data: getData, error: getError } = await supabase
    .from(DRINKS_TABLE)
    .select('*')
    .eq('name', name)
    .maybeSingle();
  if (getError) return { success: false, source: 'supabase', message: getError.message } as const;
  if (getData) return { success: true, data: getData } as const;

  const { data: insertData, error: insertError } = await supabase
    .from(DRINKS_TABLE)
    .insert([{ name, tags }])
    .select()
    .maybeSingle();
  if (insertError) return { success: false, source: 'supabase', message: insertError.message } as const;
  return { success: true, data: insertData } as const;
}

export async function getOrInsertShopDrink(
  shopId: string,
  drinkId: string,
  price: number | null = null,
  imageUrl: string | null = null,
  notes: string | null = null,
  avgRating: number | null = null
) {
  const { data: getData, error: getError } = await supabase
    .from(SHOP_DRINKS_TABLE)
    .select('*')
    .eq('shop_id', shopId)
    .eq('drink_id', drinkId)
    .maybeSingle();
  if (getError) return { success: false, source: 'supabase', message: getError.message } as const;
  if (getData) return { success: true, data: getData } as const;

  const { data: insertData, error: insertError } = await supabase
    .from(SHOP_DRINKS_TABLE)
    .insert([{ shop_id: shopId, drink_id: drinkId, price, image_url: imageUrl, notes, avg_rating: avgRating }])
    .select()
    .maybeSingle();
  if (insertError) return { success: false, source: 'supabase', message: insertError.message } as const;
  return { success: true, data: insertData } as const;
}

export async function updateShopDrink(shopDrinkId: string, avgRating: number) {
  const { error } = await supabase
    .from(SHOP_DRINKS_TABLE)
    .update({ avg_rating: avgRating })
    .eq('id', shopDrinkId);
  if (error) return { success: false, source: 'supabase', message: error.message } as const;
  return { success: true } as const;
}


