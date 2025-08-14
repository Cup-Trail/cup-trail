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
import type { JSX } from 'react';
import { useNavigate } from 'react-router-dom';
// backend
import { getRecentReviews, getOrInsertShop } from '@cuptrail/data';

const categories = ['Matcha', 'Coffee', 'Milk Tea', 'Fruit Tea'];

// --- Types ---
type Prediction = {
  place_id: string;
  description: string;
};

type PlaceDetailsAPIResponse = {
  status?: string;
  result?: {
    name?: string;
    formatted_address?: string;
    geometry?: {
      location?: {
        lat: number;
        lng: number;
      };
    };
  };
};

type Review = {
  id: string | number;
  rating: number;
  comment?: string | null;
  created_at: string;
  shop_drinks?: {
    shops?: { name?: string | null } | null;
    drinks?: { name?: string | null } | null;
  } | null;
};

export default function SearchPage(): JSX.Element {
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
      const baseUrl = import.meta.env.VITE_SUPABASE_URL ?? import.meta.env.EXPO_PUBLIC_SUPABASE_URL;
      const anonKey =
        import.meta.env.VITE_SUPABASE_ANON_KEY ?? import.meta.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
      const response = await fetch(
        `${baseUrl}/functions/v1/maps?type=autocomplete&input=${encodeURIComponent(input)}`,
        {
          headers: {
            Authorization: `Bearer ${anonKey}`,
            'Content-Type': 'application/json',
          },
        }
      );
      console.log(response);
      const json: { predictions?: Prediction[] } = await response.json();

      if (json.predictions) {
        setSuggestions(json.predictions);
      } else {
        console.warn('No predictions returned from edge function');
        setSuggestions([]);
      }
    } catch (err) {
      console.error('Autocomplete fetch error:', err);
      setSuggestions([]);
    }
  }

  async function handleSelectSuggestion(suggestion: Prediction): Promise<void> {
    try {
      const baseUrl = import.meta.env.VITE_SUPABASE_URL ?? import.meta.env.EXPO_PUBLIC_SUPABASE_URL;
      const anonKey =
        import.meta.env.VITE_SUPABASE_ANON_KEY ?? import.meta.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
      const response = await fetch(
        `${baseUrl}/functions/v1/maps?type=details&place_id=${encodeURIComponent(suggestion.place_id)}`,
        {
          headers: {
            Authorization: `Bearer ${anonKey}`,
            'Content-Type': 'application/json',
          },
        }
      );
      const data: PlaceDetailsAPIResponse = await response.json();

      if (data.status === 'OK') {
        const { name: placeName, formatted_address, geometry } = data.result || {};
        const lat = geometry?.location?.lat;
        const lng = geometry?.location?.lng;
        console.log(formatted_address);

        if (activeField === 'name' && placeName) setName(placeName);
        if (placeName && formatted_address && typeof lat === 'number' && typeof lng === 'number') {
          const result = await getOrInsertShop(placeName, formatted_address, lat, lng);
          if (!result?.success) {
            console.warn('Failed to get or create shop');
            setSuggestions([]);
            return;
          }

          const rawId = (result.data as any)?.id;
          // Accept numeric or string ids; coerce to non-empty string
          const shopId =
            rawId != null && String(rawId).trim().length > 0 ? String(rawId).trim() : '';
          if (!shopId) {
            console.warn('Missing or invalid shop id from getOrInsertShop result.', result);
            setSuggestions([]);
            return;
          }

          // Clear suggestions before navigation to avoid re-click race conditions
          setSuggestions([]);

          try {
            navigate(`/shop/${encodeURIComponent(shopId)}`, {
              state: { shopName: placeName, address: formatted_address, shopId },
            });
          } catch (navErr) {
            console.error('Navigation error to storefront route:', navErr);
          }
        }
      } else {
        console.warn('Place Details failed:', data.status);
      }
    } catch (error) {
      console.error('Failed to get place details:', error);
    }
    setSuggestions([]);
  }
  return (
    <Stack gap={2}>
      <TextField
        label="Search shops, drinks, or cities..."
        value={name}
        onChange={(e) => {
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
