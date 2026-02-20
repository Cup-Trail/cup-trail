import { CategoryRow, getCategories } from '@cuptrail/core';
import { useQuery, UseQueryResult } from '@tanstack/react-query';

const useCategoriesQuery = (): UseQueryResult<CategoryRow[], Error> =>
  useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await getCategories();
      if (res.success) return res.data;
      else return [];
    },
  });

export default useCategoriesQuery;
