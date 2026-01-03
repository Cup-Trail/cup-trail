import { getReviewsByUser, getReviewsByUserShop, type ReviewRow } from '@cuptrail/core';
import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { getUser } from '@cuptrail/utils';

interface QueryProps {
  shopId?: string;
}

const useUserReviewsQuery = ({ shopId }: QueryProps): UseQueryResult<ReviewRow[], Error> =>
  useQuery({
    queryKey: ['userReviews', shopId],
    queryFn: async () => {
      const user = await getUser();
      if (!user) return [];
      const res = shopId 
        ? await getReviewsByUserShop(user.id, shopId) 
        : await getReviewsByUser(user.id);
      if (res.success) return res.data;
      else return [];
    },
  });

export default useUserReviewsQuery;
