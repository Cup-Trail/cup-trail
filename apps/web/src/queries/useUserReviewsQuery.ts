import {
  getReviewsByUser,
  getReviewsByUserShop,
  type ReviewRow,
} from '@cuptrail/core';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';

type Props = {
  userId?: string | null;
  shopId?: string;
};

export default function useUserReviewsQuery({
  userId,
  shopId,
}: Props): UseQueryResult<ReviewRow[], Error> {
  return useQuery({
    queryKey: ['userReviews', userId, shopId],
    enabled: !!userId, // don't run until we know who the user is
    queryFn: async () => {
      if (!userId) return [];

      const res = shopId
        ? await getReviewsByUserShop(userId, shopId)
        : await getReviewsByUser(userId);

      return res.success ? res.data : [];
    },
    staleTime: 60_000,
  });
}
