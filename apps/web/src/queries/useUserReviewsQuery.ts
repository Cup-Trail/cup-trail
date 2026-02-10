import {
  getReviewsByShop,
  getReviewsByUser,
  getReviewsByUserShop,
  type ReviewRow,
} from '@cuptrail/core';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';

type Props = {
  userId?: string | null;
  shopId?: string | null;
};

export default function useUserReviewsQuery({
  userId,
  shopId,
}: Props): UseQueryResult<ReviewRow[], Error> {
  return useQuery({
    queryKey: ['userReviews', userId ?? null, shopId ?? null],
    enabled: !!userId || !!shopId,
    queryFn: async () => {
      if (userId && shopId) {
        const res = await getReviewsByUserShop(userId, shopId);
        return res.success ? res.data : [];
      }

      if (userId) {
        const res = await getReviewsByUser(userId);
        return res.success ? res.data : [];
      }

      if (shopId) {
        const res = await getReviewsByShop(shopId);
        return res.success ? res.data : [];
      }

      return [];
    },
    staleTime: 60_000,
  });
}
