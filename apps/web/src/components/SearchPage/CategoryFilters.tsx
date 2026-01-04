import { CategoryRow, getShopsByCategorySlug, ShopRow } from '@cuptrail/core';
import { Chip, Divider, Paper, Stack, Typography } from '@mui/material';
import { useState } from 'react';

import { useCategoriesQuery } from '../../queries';

const CategoryFilters = () => {
  const { data: cats } = useCategoriesQuery();

  const [selectedCategory, setSelectedCategory] = useState<CategoryRow | null>(
    null
  );
  const [categoryShops, setCategoryShops] = useState<ShopRow[]>([]);

  const handleCategorySelect = async (clickedCategory: CategoryRow) => {
    // Handle removing filter
    if (selectedCategory?.id === clickedCategory.id) {
      setSelectedCategory(null);
      setCategoryShops([]);
      return;
    }
    // Handle filter by category
    const res = await getShopsByCategorySlug(clickedCategory.slug);
    if (res.success) {
      setCategoryShops(res.data);
      setSelectedCategory(clickedCategory);
    }
  };

  return (
    <>
      {cats && (
        <Stack
          direction='row'
          spacing={1}
          sx={{ justifyContent: 'center', overflowX: 'auto', pb: 1 }}
        >
          {cats.map(c => (
            <Chip
              key={c.id}
              label={c.label}
              variant={c.id === selectedCategory?.id ? 'filled' : 'outlined'}
              color='success'
              onClick={() => handleCategorySelect(c)}
            />
          ))}
        </Stack>
      )}

      {selectedCategory && (
        <>
          <Typography variant='h6'>
            Shops for {selectedCategory.label}
          </Typography>
          {categoryShops.length === 0 && (
            <Typography>No shops matches the criteria</Typography>
          )}
          {categoryShops.length > 0 && (
            <Stack gap={1}>
              {categoryShops.map(s => (
                <Paper key={String(s.id)} variant='outlined' sx={{ p: 2 }}>
                  <Typography fontWeight={600}>{s.name}</Typography>
                  {s.address && (
                    <Typography mt={0.5} color='text.secondary'>
                      {s.address}
                    </Typography>
                  )}
                </Paper>
              ))}
            </Stack>
          )}
          <Divider />
        </>
      )}
    </>
  );
};

export default CategoryFilters;
