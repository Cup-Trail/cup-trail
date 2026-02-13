import type { CategoryRow, ShopRow } from '@cuptrail/core';
import { getShopsByCategorySlug } from '@cuptrail/core';
import { useRef, useState } from 'react';

export function useCategoryShops() {
  const [selectedCategory, setSelectedCategory] = useState<CategoryRow | null>(
    null
  );
  const [shops, setShops] = useState<ShopRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);

  const reqIdRef = useRef(0);

  async function selectCategory(clicked: CategoryRow) {
    if (selectedCategory?.id === clicked.id) {
      setSelectedCategory(null);
      setShops([]);
      setHasFetched(false);
      return;
    }

    setSelectedCategory(clicked);
    setIsLoading(true);
    setHasFetched(false);

    const reqId = ++reqIdRef.current;

    try {
      const res = await getShopsByCategorySlug(clicked.slug);
      if (reqId !== reqIdRef.current) return; // ignore stale response
      setShops(res.success ? res.data : []);
    } finally {
      if (reqId !== reqIdRef.current) return;
      setIsLoading(false);
      setHasFetched(true);
    }
  }

  return { selectedCategory, shops, isLoading, hasFetched, selectCategory };
}
