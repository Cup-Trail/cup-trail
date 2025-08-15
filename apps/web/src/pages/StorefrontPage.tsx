import { getHighlyRatedDrinks } from '@cuptrail/data/drinks';
import type { ShopDrinkRow } from '@cuptrail/data/drinks';
import { Box, Button, Paper, Stack, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import type { LocationState } from '../types';

export default function StorefrontPage() {
  const { shopId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const shopName = (location.state as LocationState)?.shopName ?? 'Shop';
  const address = (location.state as LocationState)?.address ?? '';
  const [drinks, setDrinks] = useState<ShopDrinkRow[]>([]);

  useEffect(() => {
    if (!shopId) return;
    (async () => {
      const result = await getHighlyRatedDrinks(shopId);
      if (result.success) setDrinks(result.data);
    })();
  }, [shopId]);

  return (
    <Stack gap={2}>
      <Typography variant="h4" textAlign="center" fontWeight={700}>
        {shopName}
      </Typography>
      <Typography variant="body2" color="text.secondary" textAlign="center">
        {address}
      </Typography>

      <Typography variant="h6">Popular Drinks</Typography>
      <Stack direction="row" spacing={2} sx={{ overflowX: 'auto', pb: 1 }}>
        {drinks.map((item: ShopDrinkRow) => (
          <Paper key={item.id} variant="outlined" sx={{ p: 2, minWidth: 200 }}>
            <Typography fontWeight={600}>{item.drinks.name}</Typography>
            <Typography mt={0.5}>⭐ {item.avg_rating}/5</Typography>
          </Paper>
        ))}
      </Stack>

      <Box>
        <Button
          variant="contained"
          color="secondary"
          onClick={() =>
            navigate(`/shop/${shopId}/review`, { state: { shopName } as LocationState })
          }
        >
          Write a Review
        </Button>
      </Box>
    </Stack>
  );
}
