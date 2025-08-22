import type { LocationState, ShopDrinkRow } from '@cuptrail/core';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import { Box, Button, Stack, Tab, Tabs, Typography } from '@mui/material';
import { useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import { usePopularDrinksQuery } from '../../queries';

import ReviewItem from './ReviewItem';

const STOREFRONT_TAB_VIEWS = {
  PopularDrinks: 'Popular Drinks',
  MyReviews: 'My Reviews',
};

const StorefrontPage = () => {
  const { shopId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const { data: drinks } = usePopularDrinksQuery({ shopId: shopId ?? '' });

  const [selectedView, setSelectedView] = useState<string>(
    STOREFRONT_TAB_VIEWS.PopularDrinks
  );

  const shopName = (location.state as LocationState)?.shopName ?? 'Shop';
  const address = (location.state as LocationState)?.address ?? '';

  return (
    <Stack gap={2}>
      <Typography variant="h4" fontWeight={700}>
        {shopName}
      </Typography>
      <Box display="flex" justifyContent="space-between">
        <Typography>{address}</Typography>
        <Button
          startIcon={<AddOutlinedIcon />}
          variant="contained"
          onClick={() =>
            navigate(`/shop/${shopId}/review`, {
              state: { shopName } as LocationState,
            })
          }
        >
          Add a Review
        </Button>
      </Box>

      <Box display="flex" justifyContent="center">
        <Tabs
          value={selectedView}
          onChange={(_, view) => setSelectedView(view)}
        >
          <Tab
            label={STOREFRONT_TAB_VIEWS.PopularDrinks}
            value={STOREFRONT_TAB_VIEWS.PopularDrinks}
          />
          <Tab
            label={STOREFRONT_TAB_VIEWS.MyReviews}
            value={STOREFRONT_TAB_VIEWS.MyReviews}
          />
        </Tabs>
      </Box>

      {selectedView === STOREFRONT_TAB_VIEWS.PopularDrinks && (
        <>
          {drinks && drinks.length === 0 && (
            <Typography>No popular drinks yet...</Typography>
          )}
          {drinks && drinks.length > 0 && (
            <Stack
              direction="row"
              spacing={2}
              sx={{ overflowX: 'auto', pb: 1 }}
            >
              {drinks.map((item: ShopDrinkRow) => (
                <ReviewItem key={item.id} item={item} />
              ))}
            </Stack>
          )}
        </>
      )}
    </Stack>
  );
};

export default StorefrontPage;
