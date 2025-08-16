import { supabase } from './supabaseClient';
import type { Result, Ok, Err, DrinkRow, ShopDrinkRow } from './types';

const DRINKS_TABLE = 'drinks';
const SHOP_DRINKS_TABLE = 'shop_drinks';
const SHOP_DRINK_SELECT = `
  id,
  price,
  drinks (
    id,
    name
  ),
  shops (
    id,
    name
  ),
  avg_rating,
  cover_photo_url
`;

// DrinkRow and ShopDrinkRow types are now imported from ./types

// Normalize Supabase nested array relations into single objects
function normalizeShopDrink(row: any): ShopDrinkRow {
  const d = Array.isArray(row.drinks) ? row.drinks[0] : row.drinks;
  const s = Array.isArray(row.shops) ? row.shops[0] : row.shops;
  return {
    id: row.id,
    price: row.price ?? null,
    avg_rating: row.avg_rating ?? null,
    cover_photo_url: row.cover_photo_url ?? null,
    drinks: {
      id: d?.id,
      name: d?.name ?? '',
    },
    shops: {
      id: s?.id,
      name: s?.name ?? '',
    },
  } as ShopDrinkRow;
}

export async function getHighlyRatedDrinks(
  shopId: string
): Promise<Result<ShopDrinkRow[]>> {
  try {
    const { data, error } = await supabase
      .from(SHOP_DRINKS_TABLE)
      .select(SHOP_DRINK_SELECT)
      .eq('shop_id', shopId)
      .order('avg_rating', { ascending: false })
      .limit(10);

    if (error) {
      return {
        success: false,
        source: 'supabase',
        message: error.message,
      } satisfies Err<ShopDrinkRow[]>;
    }

    if (!data || data.length === 0) {
      return {
        success: false,
        source: 'supabase',
        message: `No drink ratings found at ${shopId}`,
      } satisfies Err<ShopDrinkRow[]>;
    }

    const normalized = (data as any[]).map(normalizeShopDrink);
    return { success: true, data: normalized } satisfies Ok<ShopDrinkRow[]>;
  } catch (err) {
    return {
      success: false,
      source: 'exception',
      message: (err as any)?.message ?? 'Unknown error',
    } satisfies Err<ShopDrinkRow[]>;
  }
}

export async function getShopDrinkByName(
  shopName: string,
  drinkName: string
): Promise<Result<ShopDrinkRow>> {
  try {
    const { data, error } = await supabase
      .from(SHOP_DRINKS_TABLE)
      .select(
        `
        id,
        price,
        drinks (id, name),
        shops (id, name),
        avg_rating,
        cover_photo_url
      `
      )
      .eq('drinks.name', drinkName)
      .eq('shops.name', shopName)
      .maybeSingle();

    if (error) {
      return {
        success: false,
        source: 'supabase',
        message: error.message,
      } satisfies Err<ShopDrinkRow>;
    }

    if (!data) {
      return {
        success: false,
        source: 'supabase',
        message: `${drinkName} at ${shopName} not found`,
      } satisfies Err<ShopDrinkRow>;
    }

    const normalized = normalizeShopDrink(data);
    return { success: true, data: normalized } satisfies Ok<ShopDrinkRow>;
  } catch (err) {
    return {
      success: false,
      source: 'exception',
      message: (err as any)?.message ?? 'Unknown error',
    } satisfies Err<ShopDrinkRow>;
  }
}

export async function getOrInsertDrink(
  name: string,
  tags: string[] | null = null
): Promise<Result<DrinkRow>> {
  try {
    const { data: getData, error: getError } = await supabase
      .from(DRINKS_TABLE)
      .select('*')
      .eq('name', name)
      .maybeSingle();

    if (getError) {
      return {
        success: false,
        source: 'supabase',
        message: getError.message,
      } satisfies Err<DrinkRow>;
    }

    if (getData) {
      return { success: true, data: getData } satisfies Ok<DrinkRow>;
    }

    const { data: insertData, error: insertError } = await supabase
      .from(DRINKS_TABLE)
      .insert([{ name, tags }])
      .select()
      .maybeSingle();

    if (insertError) {
      return {
        success: false,
        source: 'supabase',
        message: insertError.message,
      } satisfies Err<DrinkRow>;
    }

    return {
      success: true,
      data: insertData as DrinkRow,
    } satisfies Ok<DrinkRow>;
  } catch (err) {
    return {
      success: false,
      source: 'exception',
      message: (err as any)?.message ?? 'Unknown error',
    } satisfies Err<DrinkRow>;
  }
}

export async function getOrInsertShopDrink(
  shopId: string,
  drinkId: string,
  price: number | null = null
): Promise<Result<ShopDrinkRow>> {
  try {
    const { data: getData, error: getError } = await supabase
      .from(SHOP_DRINKS_TABLE)
      .select(SHOP_DRINK_SELECT)
      .eq('shop_id', shopId)
      .eq('drink_id', drinkId)
      .maybeSingle();

    if (getError) {
      return {
        success: false,
        source: 'supabase',
        message: getError.message,
      } satisfies Err<ShopDrinkRow>;
    }

    if (getData) {
      return {
        success: true,
        data: normalizeShopDrink(getData),
      } satisfies Ok<ShopDrinkRow>;
    }

    const { data: insertData, error: insertError } = await supabase
      .from(SHOP_DRINKS_TABLE)
      .insert([{ shop_id: shopId, drink_id: drinkId, price }])
      .select(SHOP_DRINK_SELECT)
      .maybeSingle();

    if (insertError) {
      return {
        success: false,
        source: 'supabase',
        message: insertError.message,
      } satisfies Err<ShopDrinkRow>;
    }

    return {
      success: true,
      data: normalizeShopDrink(insertData),
    } satisfies Ok<ShopDrinkRow>;
  } catch (err) {
    return {
      success: false,
      source: 'exception',
      message: (err as any)?.message ?? 'Unknown error',
    } satisfies Err<ShopDrinkRow>;
  }
}

export async function updateShopDrink(
  shopDrinkId: string,
  updateFieldsObj: Partial<
    Pick<ShopDrinkRow, 'price' | 'avg_rating' | 'cover_photo_url'>
  > &
    Record<string, any>
): Promise<Result<ShopDrinkRow>> {
  try {
    const { data, error } = await supabase
      .from(SHOP_DRINKS_TABLE)
      .update(updateFieldsObj)
      .eq('id', shopDrinkId)
      .select(SHOP_DRINK_SELECT)
      .maybeSingle();

    if (error) {
      return {
        success: false,
        source: 'supabase',
        message: error.message,
      } satisfies Err<ShopDrinkRow>;
    }

    return {
      success: true,
      data: normalizeShopDrink(data),
    } satisfies Ok<ShopDrinkRow>;
  } catch (err) {
    return {
      success: false,
      source: 'exception',
      message: (err as any)?.message ?? 'Unknown error',
    } satisfies Err<ShopDrinkRow>;
  }
}
