import type { Geocode } from '@cuptrail/core';
import { getCityCoords } from '@cuptrail/maps-api';
import { useEffect, useState } from 'react';
import { useDebouncedValue } from './useDebouncedValue';

type Props = {
  query: string;
  debounceMs?: number;
  disabled?: boolean;
};

export function useCityAutocomplete({
  query,
  debounceMs = 250,
  disabled = false,
}: Props) {
  const debouncedQuery = useDebouncedValue(query, debounceMs);

  const [items, setItems] = useState<Geocode[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    async function run() {
      if (disabled) {
        setItems([]);
        setError(null);
        return;
      }

      const q = debouncedQuery.trim();
      if (!q) {
        setItems([]);
        setError(null);
        return;
      }

      try {
        const preds = await getCityCoords(q);
        if (!alive) return;
        setItems(preds);
        setError(null);
      } catch {
        if (!alive) return;
        setItems([]);
        setError(null); // keep silent like you had before
      }
    }

    void run();
    return () => {
      alive = false;
    };
  }, [debouncedQuery, disabled]);

  function clear() {
    setItems([]);
    setError(null);
  }

  return { items, error, clear };
}
