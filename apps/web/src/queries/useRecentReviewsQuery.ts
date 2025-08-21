import { getRecentReviews, ReviewRow } from '@cuptrail/core';
import { useQuery, UseQueryResult } from '@tanstack/react-query';

const useRecentReviewsQuery = (): UseQueryResult<ReviewRow[], Error> =>
  useQuery({
    queryKey: ['recentReviews'],
    queryFn: async () => {
      const res = await getRecentReviews();
      if (res.success) return res.data;
      else return [];
    },
  });

export default useRecentReviewsQuery;
