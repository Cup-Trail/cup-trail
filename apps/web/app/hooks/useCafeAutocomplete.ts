import type { Prediction, UserCoordinates } from '@cuptrail/core';
import {
  getAutocomplete,
  normalizeAutocompleteResults,
} from '@cuptrail/maps-api';
import { useEffect, useState } from 'react';

import { useDebouncedValue } from './useDebouncedValue';

type Props = {
  query: string;
  coords: UserCoordinates | null;
  debounceMs?: number;
};

export function useCafeAutocomplete({
  query,
  coords,
  debounceMs = 250,
}: Props) {
  const debouncedQuery = useDebouncedValue(query, debounceMs);

  const [items, setItems] = useState<Prediction[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let alive = true;

    async function run() {
      const q = debouncedQuery.trim();
      if (!q) {
        setItems([]);
        setError(null);
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const predictions = await getAutocomplete(q, coords ?? undefined);
        const normalized = await normalizeAutocompleteResults(predictions);

        if (!alive) return;
        setItems(normalized);
        setError(null);
      } catch {
        if (!alive) return;
        setItems([]);
        setError('Error getting results. Please try again');
      } finally {
        if (alive) {
          setLoading(false);
        }
      }
    }

    void run();
    return () => {
      alive = false;
    };
  }, [debouncedQuery, coords]);

  function clear() {
    setItems([]);
    setError(null);
    setLoading(false);
  }

  return { items, error, loading, clear };
}
