import type { LocationState, Prediction, ReviewRow } from '@cuptrail/core';
import { getOrInsertShop } from '@cuptrail/core';
import { getAutocomplete, getPlaceDetails } from '@cuptrail/utils';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import SearchIcon from '@mui/icons-material/Search';
import { Autocomplete, Stack, TextField, Typography } from '@mui/material';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useRecentReviewsQuery } from '../../queries';

import CategoryFilters from './CategoryFilters';
import ReviewItem from './ReviewItem';

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
      const data = await getPlaceDetails(suggestion.placeId);
      if (!data) return;

      const { displayName, formattedAddress, location } = data;

      if (displayName && formattedAddress && location) {
        const result = await getOrInsertShop(
          displayName,
          formattedAddress,
          location.latitude,
          location.longitude
        );

        if (!result?.success) return;

        const shopId = result.data.id;
        if (!shopId) return;

        navigate(`/shop/${encodeURIComponent(shopId)}`, {
          state: {
            shopName: displayName,
            address: formattedAddress,
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
        getOptionLabel={s => s.text}
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
            slotProps={{
              input: {
                ...params.InputProps,
                startAdornment: <SearchIcon />,
              },
            }}
          />
        )}
      />

      {/* TODO hook up current location */}
      <Autocomplete
        options={[]}
        filterOptions={x => x}
        renderInput={params => (
          <TextField
            {...params}
            label="Location"
            placeholder="Current Location"
            fullWidth
            slotProps={{
              input: {
                ...params.InputProps,
                startAdornment: <LocationOnOutlinedIcon />,
              },
            }}
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
                <ReviewItem key={item.id} item={item} />
              ))}
            </Stack>
          )}
        </>
      )}
    </Stack>
  );
}
