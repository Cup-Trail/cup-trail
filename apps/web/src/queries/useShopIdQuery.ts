import { getShopByID, ShopRow } from '@cuptrail/core';
import { useQuery, UseQueryResult } from '@tanstack/react-query';

const useShopIdQuery = (
  shopId: string | null | undefined
): UseQueryResult<ShopRow | null, Error> =>
  useQuery({
    queryKey: ['shop', shopId],
    queryFn: async () => {
      if (!shopId) {
        return null;
      }
      const res = await getShopByID(shopId);
      if (res.success) return res.data;
      else return null;
    },
  });

export default useShopIdQuery;
