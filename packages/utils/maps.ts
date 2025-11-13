/**
 * GoogleMaps utilities
 *
 * These helpers call a Supabase Edge Function at `${supabaseUrl}/functions/v1/maps`
 * which proxies Google Places API v1 and handles CORS. The function supports
 * two endpoints, selectable via the `endpoint` query param or path segment:
 * - `autocomplete`: POST JSON body to `...?endpoint=autocomplete` (for text predictions)
 * - `details`: GET to `...?endpoint=details&place_id=places/<PLACE_ID>` (for place details)
 *
 * Field masks:
 * - You can pass desired fields by adding `X-Goog-FieldMask` header and it will be
 *   forwarded by the Edge Function to Google.
 *
 * Types and mapping:
 * - Autocomplete returns an array of `Prediction` with minimal fields used by the app:
 *   `placeId`, `text`, and `structuredFormat.{mainText,secondaryText}`.
 * - Details maps Google Places v1 fields to a simplified `PlaceDetails` shape
 *   used by the web UI.
 */
import type { PlaceDetails, Prediction } from '@cuptrail/core';

import { getEnv } from './env';
import { apiGet } from './fetchWrapper';

const { supabaseUrl } = getEnv();
const mapsBaseUrl = `${supabaseUrl}/functions/v1/maps`;

/**
 * Get autocomplete suggestions for a search input.
 *
 * Makes a POST request to the Edge Function:
 *   `${supabaseUrl}/functions/v1/maps?endpoint=autocomplete`
 * with JSON body `{ input: string, includedPrimaryTypes: string[] }`.
 * The Edge Function forwards the request to Google Places v1
 * `places:autocomplete` and returns suggestions, which are mapped into the
 * app's `Prediction` shape.
 *
 * @param input - Free-text user input; trimmed before sending
 * @returns Array of normalized `Prediction` rows
 *
 * @example
 * const items = await getAutocomplete('komeya no b');
 * items[0] => { placeId, text, structuredFormat: { mainText, secondaryText } }
 */
export async function getAutocomplete(input: string): Promise<Prediction[]> {
  if (!input.trim()) {
    return [];
  }

  const url = `${mapsBaseUrl}?endpoint=autocomplete&search_text=${encodeURIComponent(
    input
  )}`;
  const response = await apiGet<any>(url);

  if (!response.ok) {
    throw new Error(response.error || `HTTP error! status: ${response.status}`);
  }

  const suggestions = (response.data as any)?.results ?? [];
  const results: Prediction[] = suggestions
    .map((place: any) => {
      const prediction: Prediction = {
        id: place.id || '',
        name: place.displayLines[0] || '',
        address: place.displayLines[1] || '',
      };
      return prediction;
    })
    .filter(
      (place: Prediction) =>
        Boolean(place.id) && Boolean(place.name) && Boolean(place.address)
    );

  return results;
}

/**
 * Get detailed information about a place.
 *
 * Makes a GET request to the Edge Function:
 *   `${supabaseUrl}/functions/v1/maps?endpoint=details&place_id=places/<ID>`
 * The Edge Function forwards to Google Places v1 `GET /places/<ID>` and the
 * result is mapped to a simplified `PlaceDetails` shape used by the app.
 *
 * @param placeId - Google Places ID (returned by `getAutocomplete`)
 * @returns Mapped place details or null if incomplete
 *
 * @example
 * const data = await getPlaceDetails('ChIJzYNpB1DeAGAR3UexVosu4jM');
 * data.location.{latitude,longitude}
 */
export async function getPlaceDetails(
  placeId: string
): Promise<PlaceDetails | null> {
  if (!placeId) {
    return null;
  }

  // GET with query params to edge function endpoint=details
  const url = `${mapsBaseUrl}?endpoint=details&place_id=${encodeURIComponent(
    placeId
  )}`;

  const response = await apiGet<any>(url);

  if (!response.ok) {
    throw new Error(response.error || `HTTP error! status: ${response.status}`);
  }

  const data = response.data as any;
  if (!data) return null;

  const name: string = data.name || '';
  const formattedAddressLines: string[] = data.formattedAddressLines || '';
  const latitude: number | undefined = data.coordinate?.latitude;
  const longitude: number | undefined = data.coordinate?.longitude;

  if (
    !name ||
    !formattedAddressLines ||
    typeof latitude !== 'number' ||
    typeof longitude !== 'number'
  ) {
    return null;
  }

  const selectedPlace: PlaceDetails = {
    name: name,
    formattedAddress: formattedAddressLines.join(', '),
    coordinate: { latitude, longitude },
  };

  return selectedPlace;
}
