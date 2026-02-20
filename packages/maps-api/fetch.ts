/**
 * Apple Maps Server API Utilities
 *
 * These helpers call a Supabase Edge Function:
 *    `${supabaseUrl}/functions/v1/maps`
 *
 * The Edge Function proxies the Apple Maps Server API, adds auth tokens,
 * and handles all CORS requirements for the client.
 *
 * Routes:
 *
 *  • `/autocomplete`
 *      → Text-based place autocomplete (cafes, restaurants, drinks, etc.)
 *      → Accepts optional `userLocation=<lat>,<lng>` to bias results.
 *
 *  • `/details`
 *      → Detailed place lookup by Apple Place ID.
 *
 *  • `/geocode`
 *      → City / locality autocomplete intended for “fallback city selection”
 *        when device location is unavailable or denied.
 *
 * Each endpoint returns normalized JSON so the client receives a consistent
 * shape regardless of Apple’s internal response structure.
 */

import type { AutocompleteResult, Geocode, PlaceDetails } from '@cuptrail/core';

import { getEnv } from '../utils/env';
import { apiGet } from '../utils/fetchWrapper';

const { supabaseUrl } = getEnv();
const mapsBaseUrl = `${supabaseUrl}/functions/v1/maps`;

type RawAutocompleteResponse = {
  results?: AutocompleteResult[];
};

type RawPlaceDetailsResponse = {
  name?: string;
  formattedAddressLines?: string[];
  coordinate?: {
    latitude?: number;
    longitude?: number;
  };
};

type RawGeocodeSuggestion = {
  name?: string;
  formattedAddressLines?: string[];
  coordinate?: {
    latitude?: number;
    longitude?: number;
  };
};

type RawGeocodeResponse = {
  results?: RawGeocodeSuggestion[];
};

/**
 * Fetch autocomplete predictions for shops / cafes / drinks.
 *
 * Calls:
 *   `${mapsBaseUrl}?endpoint=autocomplete&search_text=<query>`
 *
 * If `userCoordinates` is provided, the request includes:
 *   `&userLocation=<lat>,<lng>`
 *
 * The Apple Maps search service returns `displayLines[]` which is normalized
 * into the app’s `Prediction` structure:
 *   {
 *     id: string;
 *     name: string;
 *     address: string;
 *   }
 *
 * The function filters out incomplete rows (e.g., missing ID, name, or address).
 *
 * @param input            User search text
 * @param userCoordinates  Optional coordinate bias (device or selected city)
 * @returns                Array of `Prediction` items
 */

export async function getAutocomplete(
  input: string,
  userCoordinates?: { latitude: number; longitude: number }
): Promise<AutocompleteResult[]> {
  if (!input) {
    return [];
  }

  const coordParam = userCoordinates
    ? `&userLocation=${encodeURIComponent(`${userCoordinates.latitude},${userCoordinates.longitude}`)}`
    : '';

  const url = `${mapsBaseUrl}/autocomplete?q=${encodeURIComponent(
    input
  )}${coordParam}`;

  const response = await apiGet<RawAutocompleteResponse>(url);

  if (!response.ok) {
    throw new Error(response.error || `HTTP error! status: ${response.status}`);
  }

  const suggestions = response.data?.results ?? [];

  return suggestions;
}

/**
 * Fetch detailed information for a specific place by its Apple Place ID.
 *
 * Calls:
 *   `${mapsBaseUrl}?endpoint=details&place_id=<ID>`
 *
 * The Edge Function returns a mapped object containing:
 *   - name: string
 *   - formattedAddressLines: string[]
 *   - coordinate: { latitude: number; longitude: number }
 *
 * This function normalizes the response into the app’s `PlaceDetails` shape:
 *   {
 *     name: string;
 *     formattedAddress: string;
 *     coordinate: { latitude: number; longitude: number };
 *   }
 *
 * Returns `null` if the place details are incomplete or malformed.
 */
export async function getPlaceDetails(
  placeId: string
): Promise<PlaceDetails | null> {
  if (!placeId) {
    return null;
  }

  const url = `${mapsBaseUrl}/details?id=${encodeURIComponent(placeId)}`;

  const response = await apiGet<RawPlaceDetailsResponse>(url);

  if (!response.ok) {
    throw new Error(response.error || `HTTP error! status: ${response.status}`);
  }

  const data = response.data;
  if (!data) return null;

  const name: string = data.name || '';
  const formattedAddressLines: string[] = data.formattedAddressLines ?? [];
  const latitude: number | undefined = data.coordinate?.latitude;
  const longitude: number | undefined = data.coordinate?.longitude;

  if (
    !name ||
    !formattedAddressLines.length ||
    typeof latitude !== 'number' ||
    typeof longitude !== 'number'
  ) {
    return null;
  }

  const selectedPlace: PlaceDetails = {
    name,
    formattedAddress: formattedAddressLines.join(', '),
    coordinate: { latitude, longitude },
  };

  return selectedPlace;
}

/**
 * Fetch city/locality autocomplete suggestions (fallback for when the user
 * denies device location access).
 *
 * Calls:
 *   `${mapsBaseUrl}?endpoint=geocode&search_text=<CITY>`
 *
 * Expected Edge Function normalization:
 *   {
 *     results: [
 *       {
 *         name: string;
 *         formattedAddressLines: string[];
 *         coordinate: { latitude: number; longitude: number };
 *       },
 *       ...
 *     ];
 *   }
 *
 * The result is converted into the app’s `Geocode` format:
 *   {
 *     name: string;
 *     address: string;
 *     coordinate: { latitude: number; longitude: number };
 *   }
 *
 * Only results with name, address, and coordinates are returned.
 *
 * @param cityQuery   The text the user typed (e.g., "san francisco")
 * @returns           Array of city-level geocode results
 */
export async function getCityCoords(cityQuery: string): Promise<Geocode[]> {
  if (!cityQuery) {
    return [];
  }

  const url = `${mapsBaseUrl}/geocode?q=${encodeURIComponent(cityQuery)}`;

  const response = await apiGet<RawGeocodeResponse>(url);

  if (!response.ok) {
    throw new Error(response.error || `HTTP error! status: ${response.status}`);
  }

  const suggestions = response.data?.results ?? [];

  const results: Geocode[] = suggestions
    .map((place): Geocode | null => {
      const name = place.name ?? '';
      const address = (place.formattedAddressLines ?? []).join(', ');
      const latitude = place.coordinate?.latitude;
      const longitude = place.coordinate?.longitude;

      if (
        !name ||
        !address ||
        typeof latitude !== 'number' ||
        typeof longitude !== 'number'
      ) {
        return null;
      }

      return {
        name,
        address,
        coordinate: {
          latitude,
          longitude,
        },
      };
    })
    .filter((geolocation): geolocation is Geocode => geolocation !== null);

  return results;
}
