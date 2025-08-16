import type { Prediction, PlaceDetailsAPIResponse } from '@cuptrail/core';

// Environment-aware function to get the base URL and API key
function getMapsConfig() {
  // Try to read from VITE_ (web) first
  if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
    return {
      baseUrl: (import.meta as any).env.VITE_SUPABASE_URL || '',
      apiKey: (import.meta as any).env.VITE_SUPABASE_ANON_KEY || '',
    };
  }
  // Fall back to EXPO_PUBLIC_ (mobile)
  else if (typeof process !== 'undefined' && (process as any).env) {
    return {
      baseUrl: (process as any).env.EXPO_PUBLIC_SUPABASE_URL || '',
      apiKey: (process as any).env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
    };
  }
  // Fall back to empty strings (will throw error)
  else {
    return {
      baseUrl: '',
      apiKey: '',
    };
  }
}

/**
 * Get autocomplete suggestions for a search input
 * @param input - The search input text
 * @returns Promise with predictions array
 */
export async function getAutocomplete(input: string): Promise<Prediction[]> {
  if (!input.trim()) {
    return [];
  }

  const { baseUrl, apiKey } = getMapsConfig();
  
  if (!baseUrl || !apiKey) {
    throw new Error('Maps configuration not found. Make sure environment variables are set.');
  }

  try {
    const response = await fetch(
      `${baseUrl}/functions/v1/maps?type=autocomplete&input=${encodeURIComponent(input.trim())}`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const json: { predictions?: Prediction[] } = await response.json();
    return json.predictions || [];
  } catch (error) {
    console.error('Error fetching autocomplete:', error);
    return [];
  }
}

/**
 * Get detailed information about a place
 * @param placeId - Google Places place_id
 * @returns Promise with place details
 */
export async function getPlaceDetails(placeId: string): Promise<PlaceDetailsAPIResponse | null> {
  if (!placeId) {
    return null;
  }

  const { baseUrl, apiKey } = getMapsConfig();
  
  if (!baseUrl || !apiKey) {
    throw new Error('Maps configuration not found. Make sure environment variables are set.');
  }

  try {
    const response = await fetch(
      `${baseUrl}/functions/v1/maps?type=details&place_id=${encodeURIComponent(placeId)}`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: PlaceDetailsAPIResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching place details:', error);
    return null;
  }
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
