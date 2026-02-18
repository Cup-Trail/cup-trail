import type { AutocompleteResult, Prediction } from '@cuptrail/core';
export async function normalizeAutocompleteResults(
  results: AutocompleteResult[]
): Promise<Prediction[]> {
  const normalized: Prediction[] = results
    .map(place => {
      const lines: string[] = place.displayLines ?? [];
      const name = lines[0] || '';
      const address = lines[1] || '';
      const prediction: Prediction = {
        id: place.id || '',
        name,
        address,
      };
      return prediction;
    })
    .filter(
      (place: Prediction) =>
        Boolean(place.id) && Boolean(place.name) && Boolean(place.address)
    );
  return normalized;
}
