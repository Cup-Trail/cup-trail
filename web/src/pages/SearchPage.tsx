import React, { useEffect, useMemo, useState } from 'react';
import { Box, Chip, Divider, List, ListItemButton, ListItemText, Stack, TextField, Typography, Paper } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { fetchRecentReviews } from '../lib/reviews';
import { fetchOrInsertShop } from '../lib/shops';

const categories = ['Matcha', 'Boba', 'Coffee', 'Milk Tea', 'Fruit Tea'];

export default function SearchPage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const result = await fetchRecentReviews();
      if (result.success) setReviews(result.data);
    })();
  }, []);

  async function fetchAutocomplete(input: string) {
    if (!input) {
      setSuggestions([]);
      setName('');
      return;
    }
    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/maps?type=autocomplete&input=${encodeURIComponent(input)}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
    });
    const json = await res.json();
    setSuggestions(json.predictions ?? []);
  }

  async function handleSelectSuggestion(suggestion: any) {
    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/maps?type=details&place_id=${encodeURIComponent(suggestion.place_id)}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
    });
    const data = await res.json();
    if (data.status !== 'OK') return;
    const { name, formatted_address, geometry } = data.result || {};
    const lat = geometry?.location?.lat;
    const lng = geometry?.location?.lng;
    if (name && formatted_address && lat && lng) {
      const result = await fetchOrInsertShop(name, formatted_address, lat, lng);
      if (result.success) {
        navigate(`/shop/${result.data.id}`, { state: { shopName: name, address: formatted_address } });
      }
    }
    setSuggestions([]);
  }

  return (
    <Stack gap={2}>
      <TextField
        label="Search shops, drinks, or cities..."
        value={name}
        onChange={(e) => { setName(e.target.value); fetchAutocomplete(e.target.value); }}
        size="medium"
        fullWidth
      />
      {suggestions.length > 0 && (
        <Paper variant="outlined">
          <List dense>
            {suggestions.map((s) => (
              <ListItemButton key={s.place_id} onClick={() => handleSelectSuggestion(s)}>
                <ListItemText primary={s.description} />
              </ListItemButton>
            ))}
          </List>
        </Paper>
      )}

      <Box>
        <Stack direction="row" spacing={1} sx={{ overflowX: 'auto', pb: 1 }}>
          {categories.map((c) => (
            <Chip key={c} label={c} color="secondary" variant="outlined" />
          ))}
        </Stack>
      </Box>

      <Divider />

      <Typography variant="h6">Recently Reviewed Shops</Typography>
      <Stack gap={1}>
        {reviews.map((item) => {
          const shopName = item.shop_drinks?.shops?.name;
          const drinkName = item.shop_drinks?.drinks?.name;
          return (
            <Paper key={item.id} variant="outlined" sx={{ p: 2 }}>
              <Typography fontWeight={600}>
                {drinkName ? `${drinkName} @ ${shopName}` : 'Review'}
              </Typography>
              <Typography mt={0.5}>⭐ {item.rating}/10</Typography>
              {item.comment && <Typography mt={0.5} fontStyle="italic" color="text.secondary">{item.comment}</Typography>}
              <Typography mt={0.5} variant="caption" color="text.secondary">
                {new Date(item.created_at).toLocaleDateString()}
              </Typography>
            </Paper>
          );
        })}
      </Stack>
    </Stack>
  );
}


