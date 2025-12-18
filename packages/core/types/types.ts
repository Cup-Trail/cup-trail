/**
 * Common result type for data layer functions.
 */
export type Result<T> =
  | { success: true; data: T }
  | {
      success: false;
      source: 'supabase' | 'exception' | 'client';
      message: string;
    };

export type Ok<T> = Extract<Result<T>, { success: true }>;
export type Err<T> = Extract<Result<T>, { success: false }>;

export function isOk<T>(r: Result<T>): r is Ok<T> {
  return r.success;
}

export function isErr<T>(r: Result<T>): r is Err<T> {
  return !r.success;
}

export interface ShopRow {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  image_url: string | null;
  archived: boolean;
  created_at?: string;
  updated_at?: string;
}
export interface DrinkRow {
  id: string;
  name: string;
}
export interface ShopDrinkRow {
  id: string;
  price: number | null;
  avg_rating: number;
  cover_photo_url: string | null;

  drinks: DrinkRow;
  shops: ShopRow;
}

export interface ReviewRow {
  id: string;
  rating: number;
  comment: string | null;
  media_urls: string[] | null;
  created_at: string;

  shop_drinks: ShopDrinkRow;
}
export interface CategoryRow {
  id: string;
  slug: string;
  sort_order?: number;
  label?: string;
}
export interface ShopDrinkCategoryRow {
  shop_drinks: ShopDrinkRow[];
  categories: CategoryRow[];
}

export type ShopsByCategory = {
  shop_drinks?: ShopDrinkRow;
};

// Business logic types
export interface LocationState {
  shopName: string;
  shopId: string;
  address: string;
  latitude: number;
  longitude: number;
}
