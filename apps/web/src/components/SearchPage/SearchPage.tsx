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
    suggestion: Prediction | string | null
  ): Promise<void> {
    if (!suggestion) return;

    // If it's a string (freeSolo input), we can't process it as a place
    if (typeof suggestion === 'string') return;

    try {
      const data = await getPlaceDetails(suggestion.id);
      if (!data) return;

      const { name, formattedAddress, coordinate } = data;

      if (name && formattedAddress && location) {
        const result = await getOrInsertShop(
          name,
          formattedAddress,
          coordinate.latitude,
          coordinate.longitude
        );

        if (!result?.success) return;

        const shopId = result.data.id;
        if (!shopId) return;

        navigate(`/shop/${encodeURIComponent(shopId)}`, {
          state: {
            shopName: name,
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
        freeSolo
        getOptionLabel={option =>
          typeof option === 'string'
            ? option
            : `${option.name}${option.address ? ` — ${option.address}` : ''}`
        }
        renderOption={(props, option) => (
          <li {...props} key={option.id}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontWeight: 500 }}>{option.name}</span>
              <span style={{ fontSize: '0.85rem', color: '#666' }}>
                {option.address}
              </span>
            </div>
          </li>
        )}
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
        freeSolo
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
