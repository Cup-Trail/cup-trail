import React, { useEffect, useState } from 'react';
import { Box, Button, Chip, Paper, Stack, Typography } from '@mui/material';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { fetchHighlyRatedDrinks } from '../lib/drinks';

export default function StorefrontPage() {
  const { shopId } = useParams();
  const navigate = useNavigate();
  const location = useLocation() as any;
  const shopName = location.state?.shopName ?? 'Shop';
  const address = location.state?.address ?? '';
  const [drinks, setDrinks] = useState<any[]>([]);

  useEffect(() => {
    if (!shopId) return;
    (async () => {
      const result = await fetchHighlyRatedDrinks(shopId);
      if (result.success) setDrinks(result.data);
    })();
  }, [shopId]);

  return (
    <Stack gap={2}>
      <Typography variant="h4" textAlign="center" fontWeight={700}>{shopName}</Typography>
      <Typography variant="body2" color="text.secondary" textAlign="center">{address}</Typography>

      <Typography variant="h6">Popular Drinks</Typography>
      <Stack direction="row" spacing={2} sx={{ overflowX: 'auto', pb: 1 }}>
        {drinks.map((item) => (
          <Paper key={item.id} variant="outlined" sx={{ p: 2, minWidth: 200 }}>
            <Typography fontWeight={600}>{item.drinks.name}</Typography>
            <Typography mt={0.5}>⭐ {item.avg_rating}/10</Typography>
          </Paper>
        ))}
      </Stack>

      <Box>
        <Button variant="contained" color="secondary" onClick={() => navigate(`/shop/${shopId}/review`, { state: { shopName } })}>
          Write a Review
        </Button>
      </Box>
    </Stack>
  );
}


