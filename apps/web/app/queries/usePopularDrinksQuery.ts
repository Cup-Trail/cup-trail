import { getHighlyRatedDrinks, ShopDrinkRow } from '@cuptrail/core';
import { useQuery, UseQueryResult } from '@tanstack/react-query';

const usePopularDrinksQuery = (
  shopId: string
): UseQueryResult<ShopDrinkRow[], Error> =>
  useQuery({
    queryKey: ['popularDrinks', shopId],
    enabled: !!shopId,
    queryFn: async () => {
      const res = await getHighlyRatedDrinks(shopId);
      return res.success ? res.data : [];
    },
    staleTime: 60_000,
  });

export default usePopularDrinksQuery;
