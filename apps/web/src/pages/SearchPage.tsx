import { getRecentReviews, getOrInsertShop } from '@cuptrail/data';
import {
  DRINK_CATEGORIES,
  API_ENDPOINTS,
  RATING_SCALE,
} from '@cuptrail/shared';
import type {
  Prediction,
  PlaceDetailsAPIResponse,
  Review,
  LocationState,
} from '@cuptrail/shared';
import {
  Box,
  Chip,
  Divider,
  List,
  ListItemButton,
  ListItemText,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function SearchPage() {
  const navigate = useNavigate();
  const [name, setName] = useState<string>('');
  const [suggestions, setSuggestions] = useState<Prediction[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [activeField, setActiveField] = useState<'name' | null>(null);
  useEffect(() => {
    (async () => {
      const result = await getRecentReviews();
      if (result.success) setReviews(result.data as Review[]);
    })();
  }, []);

  async function getAutocomplete(input: string): Promise<void> {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}${API_ENDPOINTS.MAPS_AUTOCOMPLETE}&input=${encodeURIComponent(input)}`,
        {
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const json: { predictions?: Prediction[] } = await response.json();
      setSuggestions(json.predictions ?? []);
    } catch {
      setSuggestions([]);
    }
  }

  async function handleSelectSuggestion(suggestion: Prediction): Promise<void> {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}${API_ENDPOINTS.MAPS_DETAILS}&place_id=${encodeURIComponent(suggestion.place_id)}`,
        {
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const data: PlaceDetailsAPIResponse = await response.json();
      if (data.status !== 'OK') return;

      const {
        name: placeName,
        formatted_address,
        geometry,
      } = data.result || {};
      const lat = geometry?.location?.lat;
      const lng = geometry?.location?.lng;

      if (activeField === 'name' && placeName) setName(placeName);

      if (
        !placeName ||
        !formatted_address ||
        typeof lat !== 'number' ||
        typeof lng !== 'number'
      ) {
        setSuggestions([]);
        return;
      }

      const result = await getOrInsertShop(
        placeName,
        formatted_address,
        lat,
        lng
      );
      if (!result?.success) {
        setSuggestions([]);
        return;
      }

      const rawId = result.data?.id;
      const shopId =
        rawId != null && String(rawId).trim().length > 0
          ? String(rawId).trim()
          : '';
      if (!shopId) {
        setSuggestions([]);
        return;
      }

      setSuggestions([]);
      navigate(`/shop/${encodeURIComponent(shopId)}`, {
        state: {
          shopName: placeName,
          address: formatted_address,
          shopId,
        } as LocationState,
      });
    } catch {
      // Silently handle errors
    }
    setSuggestions([]);
  }
  return (
    <Stack gap={2}>
      <TextField
        label="Search shops, drinks, or cities..."
        value={name}
        onChange={e => {
          setName(e.target.value);
          setActiveField('name');
          getAutocomplete(e.target.value);
        }}
        size="medium"
        fullWidth
      />
      {suggestions.length > 0 && (
        <Paper variant="outlined">
          <List dense>
            {suggestions.map((s: Prediction) => (
              <ListItemButton
                key={s.place_id}
                onClick={() => handleSelectSuggestion(s)}
              >
                <ListItemText primary={s.description} />
              </ListItemButton>
            ))}
          </List>
        </Paper>
      )}

      <Box>
        <Stack direction="row" spacing={1} sx={{ overflowX: 'auto', pb: 1 }}>
          {DRINK_CATEGORIES.map(c => (
            <Chip key={c} label={c} color="secondary" variant="outlined" />
          ))}
        </Stack>
      </Box>

      <Divider />

      <Typography variant="h6">Recently Reviewed Shops</Typography>
      <Stack gap={1}>
        {reviews.map((item: Review) => {
          const shopName = item.shop_drinks?.shops?.name;
          const drinkName = item.shop_drinks?.drinks?.name;
          return (
            <Paper key={item.id} variant="outlined" sx={{ p: 2 }}>
              <Typography fontWeight={600}>
                {drinkName ? `${drinkName} @ ${shopName}` : 'Review'}
              </Typography>
              <Typography mt={0.5}>
                ⭐ {item.rating}
                {RATING_SCALE.DISPLAY_SUFFIX}
              </Typography>
              {item.comment && (
                <Typography mt={0.5} fontStyle="italic" color="text.secondary">
                  {item.comment}
                </Typography>
              )}
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
