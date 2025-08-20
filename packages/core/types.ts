/**
 * Common result type for data layer functions.
 */
export type Result<T> =
  | { success: true; data: T }
  | { success: false; source: 'supabase' | 'exception'; message: string };

/** Optional helpers */
export type Ok<T> = Extract<Result<T>, { success: true }>;
export type Err<T> = Extract<Result<T>, { success: false }>;

export function isOk<T>(r: Result<T>): r is Ok<T> {
  return r.success === true;
}

export function isErr<T>(r: Result<T>): r is Err<T> {
  return r.success === false;
}

// Database row types
export interface ShopRow {
  id?: string | number;
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
  drinks: {
    id?: string;
    name: string;
  };
  shops: {
    id?: string;
    name: string;
  };
}

export interface ReviewRow {
  id: string;
  rating: number;
  comment: string | null;
  media_urls: string[] | null;
  created_at: string;
  shop_drinks: {
    id: string;
    price: number | null;
    drinks: {
      id?: string;
      name: string;
    };
    shops: {
      id?: string;
      name: string;
    };
  };
}

export interface ShopDrinkCategoryRow {
  shop_drinks: {
    id: string;
    price: number | null;
    drinks: {
      id?: string;
      name: string;
    };
    shops: {
      id?: string;
      name: string;
    };
  };
  categories: {
    id: string;
    slug: string;
    sort_order: number;
    label: string;
  };
}

export interface CategoryRow {
  id: string;
  slug: string;
  sort_order: number;
  label: string;
}
// Business logic types
export interface LocationState {
  shopName: string;
  shopId: string;
  address: string;
  latitude: number;
  longitude: number;
}

export interface Prediction {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

export interface PlaceDetailsAPIResponse {
  result: {
    place_id: string;
    name: string;
    formatted_address: string;
    geometry: {
      location: {
        lat: number;
        lng: number;
      };
    };
  };
  status: string;
}

// Web-specific types
export type SnackState = {
  open: boolean;
  message: string;
  severity: 'success' | 'error';
};
