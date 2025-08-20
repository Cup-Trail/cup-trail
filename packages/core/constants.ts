// maps endpoint
export const API_ENDPOINTS = {
  MAPS_AUTOCOMPLETE: '/functions/v1/maps?type=autocomplete',
  MAPS_DETAILS: '/functions/v1/maps?type=details',
} as const;

// rating system constants
export const RATING_SCALE = {
  MIN: 0,
  MAX: 5,
  DISPLAY_SUFFIX: '/5',
} as const;
