// Shared types for both mobile and web apps

// Location state types
export type LocationState = {
  shopName: string;
  address?: string;
  shopId?: string;
};

// Google Maps API types
export type Prediction = {
  place_id: string;
  description: string;
};

export type PlaceDetailsAPIResponse = {
  status?: string;
  result?: {
    name?: string;
    formatted_address?: string;
    geometry?: {
      location?: {
        lat: number;
        lng: number;
      };
    };
  };
};

// Review types
export type Review = {
  id: string | number;
  rating: number; // Rating is stored on a 0-5 scale (as per UI display)
  comment?: string | null;
  created_at: string;
  shop_drinks?: {
    shops?: { name?: string | null } | null;
    drinks?: { name?: string | null } | null;
  } | null;
};

// Snackbar state type
export type SnackState = {
  open: boolean;
  message: string;
  severity: 'success' | 'error';
};

// Drink categories
export type DrinkCategory = 'Matcha' | 'Coffee' | 'Milk Tea' | 'Fruit Tea';
