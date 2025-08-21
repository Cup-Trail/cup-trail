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
  Autocomplete,
  Box,
  Chip,
  Divider,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const extractShopId = (data: ShopRow) => {
  const rawId = data?.id;
  return rawId !== null && String(rawId).trim().length > 0
    ? String(rawId).trim()
    : '';
};

export default function SearchPage() {
  const navigate = useNavigate();
  const [suggestions, setSuggestions] = useState<Prediction[]>([]);
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [categoryShops, setCategoryShops] = useState<ShopRow[]>([]);
  const [cats, setCats] = useState<CategoryRow[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<CategoryRow | null>(
    null
  );
  const [searchError, setSearchError] = useState<boolean>(false);

  useEffect(() => {
    (async () => {
      const result = await getRecentReviews();
      if (result.success) setReviews(result.data);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      const res = await getCategories();
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
      setSearchError(false);
      setSuggestions(predictions);
    } catch {
      setSearchError(true);
      setSuggestions([]);
    }
  }

  async function handleSelectSuggestion(
    suggestion: Prediction | null
  ): Promise<void> {
    if (!suggestion) return;

    try {
      const data = await getPlaceDetails(suggestion.place_id);
      if (!data) return;

      const locationData = extractLocationData(data);
      if (!locationData) return;

      const { name: placeName, address, latitude, longitude } = locationData;

      if (placeName && address && latitude && longitude) {
        const result = await getOrInsertShop(
          placeName,
          address,
          latitude,
          longitude
        );

        if (!result?.success) return;

        const shopId = extractShopId(result.data);
        if (!shopId) return;

        navigate(`/shop/${encodeURIComponent(shopId)}`, {
          state: {
            shopName: placeName,
            address: address,
            shopId,
          } as LocationState,
        });
      }
    } catch {
      // TODO implement error message in UI
    }
  }

  useEffect(() => {
    console.log('suggestions', suggestions);
  }, [suggestions]);

  return (
    <Stack gap={2}>
      <Autocomplete
        options={suggestions}
        filterOptions={x => x}
        getOptionLabel={s => s.description}
        onInputChange={(_, value) => handleAutocomplete(value)}
        onChange={(_, s) => handleSelectSuggestion(s)}
        renderInput={params => (
          <TextField
            {...params}
            label="Search by drink or cafe"
            fullWidth
            error={searchError}
            helperText={
              searchError ? 'Error getting results. Please try again' : ''
            }
          />
        )}
      />

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
