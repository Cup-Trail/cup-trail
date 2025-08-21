import type {
  LocationState,
  Prediction,
  ReviewRow,
  ShopRow,
} from '@cuptrail/core';
import { getOrInsertShop } from '@cuptrail/core';
import {
  extractLocationData,
  getAutocomplete,
  getPlaceDetails,
} from '@cuptrail/utils';
import { Autocomplete, Stack, TextField, Typography } from '@mui/material';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRecentReviewsQuery } from '../../queries';
import CategoryFilters from './CategoryFilters';
import ReviewItem from './ReviewItem';

const extractShopId = (data: ShopRow) => {
  const rawId = data?.id;
  return rawId !== null && String(rawId).trim().length > 0
    ? String(rawId).trim()
    : '';
};

export default function SearchPage() {
  const navigate = useNavigate();
  const [suggestions, setSuggestions] = useState<Prediction[]>([]);
  const [searchError, setSearchError] = useState<boolean>(false);

  const { data: reviews } = useRecentReviewsQuery();

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

      <CategoryFilters />

      {reviews && (
        <>
          <Typography variant="h6">Recently Reviewed Shops</Typography>
          {reviews.length === 0 && <Typography>No recent reviews</Typography>}
          {reviews.length > 0 && (
            <Stack gap={1}>
              {reviews.map((item: ReviewRow) => (
                <ReviewItem item={item} />
              ))}
            </Stack>
          )}
        </>
      )}
    </Stack>
  );
}
