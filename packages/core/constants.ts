// Shared constants for both mobile and web apps

// API endpoints
export const API_ENDPOINTS = {
  MAPS_AUTOCOMPLETE: '/functions/v1/maps?type=autocomplete',
  MAPS_DETAILS: '/functions/v1/maps?type=details',
} as const;

// Rating system constants
export const RATING_SCALE = {
  MIN: 0,
  MAX: 5,
  DISPLAY_SUFFIX: '/5',
} as const;

// Drink categories
export const DRINK_CATEGORIES = ['Matcha', 'Coffee', 'Milk Tea', 'Fruit Tea'] as const;
