import { getHighlyRatedDrinks, ShopDrinkRow } from '@cuptrail/core';
import { useQuery, UseQueryResult } from '@tanstack/react-query';

interface QueryProps {
  shopId: string;
}

const usePopularDrinksQuery = ({
  shopId,
}: QueryProps): UseQueryResult<ShopDrinkRow[], Error> =>
  useQuery({
    queryKey: ['popularDrinks', shopId],
    enabled: !!shopId,
    queryFn: async () => {
      const res = await getHighlyRatedDrinks(shopId);
      if (res.success) return res.data;
      else return [];
    },
  });

export default usePopularDrinksQuery;
