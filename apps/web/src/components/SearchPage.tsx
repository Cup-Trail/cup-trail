import type {
  CategoryRow,
  LocationState,
  Prediction,
  ReviewRow,
  ShopRow,
} from '@cuptrail/core';
import {
  getCategories,
  getOrInsertShop,
  getRecentReviews,
  getShopsByCategorySlug,
  RATING_SCALE,
} from '@cuptrail/core';
import {
  extractLocationData,
  getAutocomplete,
  getPlaceDetails,
} from '@cuptrail/utils';
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
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [activeField, setActiveField] = useState<'name' | null>(null);
  const [categoryShops, setCategoryShops] = useState<ShopRow[]>([]);
  const [cats, setCats] = useState<CategoryRow[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<CategoryRow | null>(
    null
  );
  useEffect(() => {
    (async () => {
      const result = await getRecentReviews();
      if (result.success) setReviews(result.data);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      const res = await getCategories(20);
      if (res.success) setCats(res.data);
    })();
  }, []);

  async function handleAutocomplete(input: string): Promise<void> {
    if (!input) {
      setSuggestions([]);
      return;
    }

    try {
      const predictions = await getAutocomplete(input);
      setSuggestions(predictions);
    } catch {
      setSuggestions([]);
    }
  }

  async function handleSelectSuggestion(suggestion: Prediction): Promise<void> {
    try {
      const data = await getPlaceDetails(suggestion.place_id);

      if (!data) {
        setSuggestions([]);
        return;
      }

      const locationData = extractLocationData(data);

      if (!locationData) {
        setSuggestions([]);
        return;
      }

      const { name: placeName, address, latitude, longitude } = locationData;

      if (activeField === 'name' && placeName) setName(placeName);

      if (
        activeField === 'name' &&
        placeName &&
        address &&
        latitude &&
        longitude
      ) {
        const result = await getOrInsertShop(
          placeName,
          address,
          latitude,
          longitude
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
            address: address,
            shopId,
          } as LocationState,
        });
      }
    } catch {
      // Silently handle errors
    }
    setSuggestions([]);
  }
  return (
    <Stack gap={2}>
      <TextField
        label="Search by drink or cafe"
        value={name}
        onChange={e => {
          setName(e.target.value);
          setActiveField('name');
          handleAutocomplete(e.target.value);
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
          {cats.map(c => (
            <Chip
              key={c.id}
              label={c.label}
              color="secondary"
              variant="outlined"
              onClick={async () => {
                if (selectedCategory?.id === c.id) {
                  setSelectedCategory(null);
                  setCategoryShops([]);
                  return;
                }
                const res = await getShopsByCategorySlug(c.slug);
                if (res.success) {
                  setCategoryShops(res.data);
                  setSelectedCategory(c);
                }
              }}
            />
          ))}
        </Stack>
      </Box>

      <Divider />

      {selectedCategory && categoryShops.length > 0 && (
        <>
          <Typography variant="h6">
            Shops for {selectedCategory.label}
          </Typography>
          <Stack gap={1}>
            {categoryShops.map(s => (
              <Paper key={String(s.id)} variant="outlined" sx={{ p: 2 }}>
                <Typography fontWeight={600}>{s.name}</Typography>
                {s.address && (
                  <Typography mt={0.5} color="text.secondary">
                    {s.address}
                  </Typography>
                )}
              </Paper>
            ))}
          </Stack>
          <Divider />
        </>
      )}

      <Typography variant="h6">Recently Reviewed Shops</Typography>
      <Stack gap={1}>
        {reviews.map((item: ReviewRow) => {
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
