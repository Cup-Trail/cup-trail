import type { PlaceDetailsAPIResponse, Prediction } from '@cuptrail/core';
import { getEnv } from './env';
import { apiPost } from './fetchWrapper';

const { supabaseUrl } = getEnv();
const mapsBaseUrl = `${supabaseUrl}/functions/v1/maps`;

/**
 * Get autocomplete suggestions for a search input
 * @param input - The search input text
 * @returns Promise with predictions array
 */
export async function getAutocomplete(input: string): Promise<Prediction[]> {
  if (!input.trim()) {
    return [];
  }

  const inputParam = encodeURIComponent(input.trim());
  const params = new URLSearchParams({
    type: 'autocomplete',
    input: inputParam,
  });
  const response = await apiPost<{ predictions?: Prediction[] }>(
    `${mapsBaseUrl}?${params.toString()}`
  );

  if (!response.ok) {
    throw new Error(response.error || `HTTP error! status: ${response.status}`);
  }

  return response.data?.predictions || [];
}

/**
 * Get detailed information about a place
 * @param placeId - Google Places place_id
 * @returns Promise with place details
 */
export async function getPlaceDetails(
  placeId: string
): Promise<PlaceDetailsAPIResponse | null> {
  if (!placeId) {
    return null;
  }

  const params = new URLSearchParams({
    type: 'details',
    place_id: encodeURIComponent(placeId),
  });
  const response = await apiPost<PlaceDetailsAPIResponse>(
    `${mapsBaseUrl}?${params.toString()}`
  );

  if (!response.ok) {
    throw new Error(response.error || `HTTP error! status: ${response.status}`);
  }

  return response.data || null;
}

/**
 * Extract location data from place details response
 * @param data - Place details API response
 * @returns Extracted location data or null if invalid
 */
export function extractLocationData(data: PlaceDetailsAPIResponse) {
  if (data.status !== 'OK' || !data.result) {
    return null;
  }

  const { name, formatted_address, geometry } = data.result;
  const lat = geometry?.location?.lat;
  const lng = geometry?.location?.lng;

  if (!name || !formatted_address || !lat || !lng) {
    return null;
  }

  return {
    name,
    address: formatted_address,
    latitude: lat,
    longitude: lng,
  };
}
