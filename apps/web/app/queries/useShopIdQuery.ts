import { getShopById, type ShopRow } from '@cuptrail/core';
import { useQuery } from '@tanstack/react-query';
/**
 * Fetch shop details from Postgres using shopId.
 *
 * - Query will not run if shopId is falsy.
 * - If the fetch succeeds and the shop exists, returns the ShopRow.
 * - If the fetch succeeds but the shop does not exist, returns null.
 * - If the fetch fails (network / Postgres error), throws and sets isError.
 *
 * @param shopId
 */
const useShopIdQuery = (shopId: string) =>
  useQuery<ShopRow | null, Error>({
    queryKey: ['shopDetails', shopId],
    enabled: !!shopId,
    queryFn: async () => {
      const res = await getShopById(shopId);

      if (!res.success) {
        throw new Error(res.message);
      }

      return res.data; // ShopRow | null
    },
    staleTime: 60_000,
  });

export default useShopIdQuery;
