import type {
  Geocode,
  LocationState,
  Prediction,
  ReviewRow,
  UserCoordinates,
} from '@cuptrail/core';
import { getOrInsertShop } from '@cuptrail/core';
import {
  getAutocomplete,
  getCityCoords,
  getPlaceDetails,
} from '@cuptrail/utils';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import SearchIcon from '@mui/icons-material/Search';
import {
  Autocomplete,
  CircularProgress,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useRecentReviewsQuery } from '../../queries';

import CategoryFilters from './CategoryFilters';
import ReviewItem from './ReviewItem';

export default function SearchPage() {
  const navigate = useNavigate();
  const [suggestions, setSuggestions] = useState<Prediction[]>([]);
  const [searchError, setSearchError] = useState<boolean>(false);

  const [userCoords, setUserCoords] = useState<UserCoordinates | null>(null);
  const [locationLabel, setLocationLabel] = useState<string>('');
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLocLoading, setIsLocLoading] = useState(false);

  const [needsCity, setNeedsCity] = useState(false);
  const [cityQuery, setCityQuery] = useState('');
  const [cityCoords, setCityCoords] = useState<UserCoordinates | null>(null);
  const [citySuggestions, setCitySuggestions] = useState<Geocode[]>([]);

  const { data: reviews } = useRecentReviewsQuery();

  /** Shop Autocomplete */
  async function handleAutocomplete(input: string): Promise<void> {
    if (!input) {
      setSuggestions([]);
      return;
    }

    try {
      const coords = userCoords ?? cityCoords ?? undefined;
      const predictions = await getAutocomplete(input, coords);
      setSearchError(false);
      setSuggestions(predictions);
    } catch {
      setSearchError(true);
      setSuggestions([]);
    }
  }

  /**
   * City input / selection
   * - Typing: fetch city suggestions via getCityCoords
   * - Selecting: store selected city's coords in state
   */
  async function handleCitySelection(
    value: Geocode | string,
    fromSelect: boolean = false
  ): Promise<void> {
    // If user picked an option from the list
    if (fromSelect) {
      if (typeof value === 'string') return;

      // Assuming Geocode has latitude / longitude fields.
      // If it's value.coordinate.{latitude,longitude}, adjust accordingly.
      const lat = (value as any).coordinate?.latitude;
      const lon = (value as any).coordinate?.longitude;

      if (typeof lat === 'number' && typeof lon === 'number') {
        setCityCoords({ latitude: lat, longitude: lon });
        setUserCoords(null); // city overrides device location
        setLocationLabel(value.name);
        setNeedsCity(false);
      }
      return;
    }

    // Typing in the city field
    const text = value as string;
    setCityQuery(text);

    const trimmed = text.trim();
    if (!trimmed) {
      setCitySuggestions([]);
      setCityCoords(null);
      return;
    }

    try {
      const preds = await getCityCoords(trimmed);
      setCitySuggestions(preds);
    } catch {
      setCitySuggestions([]);
    }
  }

  /** Device Location */
  async function handleUseCurrentLocation(): Promise<void> {
    if (!('geolocation' in navigator)) {
      setLocationError('Location not supported on this device.');
      return;
    }

    setIsLocLoading(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      pos => {
        const { latitude, longitude } = pos.coords;
        const coords = { latitude, longitude };
        setUserCoords(coords);
        setCityCoords(null); // device wins over city
        setLocationLabel('Current location');
        setIsLocLoading(false);
      },
      err => {
        setIsLocLoading(false);
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setLocationError(
              'Please allow location access in your browser to use this feature.'
            );
            break;
          case err.POSITION_UNAVAILABLE:
            setLocationError('Location is currently unavailable.');
            break;
          case err.TIMEOUT:
            setLocationError('Timed out trying to get your location.');
            break;
          default:
            setLocationError('Could not get your location.');
        }
        setUserCoords(null);
        setNeedsCity(true); // fall back to city input
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5 * 60 * 1000, // 5 minutes
      }
    );
  }

  /** Shop selection */
  async function handleSelectSuggestion(
    suggestion: Prediction | string | null
  ): Promise<void> {
    if (!suggestion) return;
    if (typeof suggestion === 'string') return;
    if (!suggestion.id) return;

    try {
      const data = await getPlaceDetails(suggestion.id);
      if (!data) return;

      const { name, formattedAddress, coordinate } = data;

      if (name && formattedAddress && coordinate) {
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
      // TODO: surface UI error if needed
    }
  }

  return (
    <Stack gap={2}>
      {/* Main search input: drinks / cafes */}
      <Autocomplete
        options={suggestions}
        filterOptions={options => options.filter(o => !!o.id)}
        freeSolo
        getOptionLabel={() => ''} // always blank in the input
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
        onInputChange={(_, value) => {
          // shop predictions (uses device or city coords if present)
          void handleAutocomplete(value);
        }}
        onChange={(_, s) => {
          void handleSelectSuggestion(s);
        }}
        renderInput={params => (
          <TextField
            {...params}
            label="Search by cafe"
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

      {/* Device location picker */}
      <Autocomplete
        options={locationLabel ? [locationLabel] : []}
        value={locationLabel}
        freeSolo
        filterOptions={x => x}
        readOnly
        renderInput={params => (
          <TextField
            {...params}
            label="Location"
            placeholder="Use current location"
            fullWidth
            onClick={handleUseCurrentLocation}
            error={Boolean(locationError)}
            helperText={locationError || ''}
            slotProps={{
              input: {
                ...params.InputProps,
                startAdornment: <LocationOnOutlinedIcon />,
                endAdornment: (
                  <>
                    {isLocLoading && (
                      <CircularProgress size={18} sx={{ mr: 1 }} />
                    )}
                    {params.InputProps.endAdornment}
                  </>
                ),
              },
            }}
          />
        )}
      />

      {/* City fallback when user denies location */}
      {needsCity && (
        <Autocomplete
          options={citySuggestions ?? []}
          freeSolo
          filterOptions={x => x}
          inputValue={cityQuery}
          onInputChange={(_, value) => {
            void handleCitySelection(value);
          }}
          onChange={(_, value) => {
            if (value) void handleCitySelection(value, true);
          }}
          getOptionLabel={option =>
            typeof option === 'string' ? option : option.name
          }
          renderOption={(props, option) => {
            if (typeof option === 'string') {
              return (
                <li {...props} key={option}>
                  {option}
                </li>
              );
            }
            return (
              <li {...props} key={option.name}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontWeight: 500 }}>{option.name}</span>
                  {option.address && (
                    <span style={{ fontSize: '0.85rem', color: '#666' }}>
                      {option.address}
                    </span>
                  )}
                </div>
              </li>
            );
          }}
          renderInput={params => (
            <TextField
              {...params}
              label="City"
              placeholder="Enter a city (e.g. San Francisco)"
              fullWidth
              slotProps={{
                input: {
                  ...params.InputProps,
                  startAdornment: <LocationOnOutlinedIcon />,
                  endAdornment: null,
                },
              }}
            />
          )}
        />
      )}

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
