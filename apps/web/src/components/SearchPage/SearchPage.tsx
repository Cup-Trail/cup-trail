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

  // shop search
  const [suggestions, setSuggestions] = useState<Prediction[]>([]);
  const [searchError, setSearchError] = useState(false);

  // unified location state
  const [activeCoords, setActiveCoords] = useState<UserCoordinates | null>(
    null
  );
  const [locationInput, setLocationInput] = useState('');
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLocLoading, setIsLocLoading] = useState(false);

  // city mode
  const [needsCity, setNeedsCity] = useState(false);
  const [citySuggestions, setCitySuggestions] = useState<Geocode[]>([]);

  const { data: reviews } = useRecentReviewsQuery();

  /** Shop Autocomplete */
  async function handleAutocomplete(input: string): Promise<void> {
    const trimmed = input.trim();
    if (!trimmed) {
      setSuggestions([]);
      return;
    }

    try {
      const coords: { latitude: number; longitude: number } | undefined =
        activeCoords || undefined;

      const predictions = await getAutocomplete(trimmed, coords);
      setSearchError(false);
      setSuggestions(predictions);
    } catch {
      setSearchError(true);
      setSuggestions([]);
    }
  }

  /**
   * City input / selection
   */
  async function handleCitySelection(
    value: Geocode | string,
    fromSelect: boolean = false
  ): Promise<void> {
    // Selected a city from the list
    if (fromSelect) {
      if (typeof value === 'string') return;

      const lat = (value as any).coordinate?.latitude;
      const lon = (value as any).coordinate?.longitude;

      if (typeof lat === 'number' && typeof lon === 'number') {
        setActiveCoords({ latitude: lat, longitude: lon });
        setLocationInput(value.name);
        setLocationError(null);
        setNeedsCity(false);
        setCitySuggestions([]);
      }
      return;
    }

    // Typing city text
    const text = value as string;
    setLocationInput(text);
    setNeedsCity(true);

    const trimmed = text.trim();
    if (!trimmed) {
      setCitySuggestions([]);
      setActiveCoords(null);
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
      setNeedsCity(true);
      return;
    }

    setIsLocLoading(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      pos => {
        const { latitude, longitude } = pos.coords;
        setActiveCoords({ latitude, longitude });
        setLocationInput('Current location');
        setNeedsCity(false);
        setCitySuggestions([]);
        setIsLocLoading(false);
      },
      err => {
        setIsLocLoading(false);
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setLocationError(
              'Please allow location access in your browser or choose a city.'
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
        setActiveCoords(null);
        setNeedsCity(true);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5 * 60 * 1000,
      }
    );
  }

  /** Shop selection */
  async function handleSelectSuggestion(
    suggestion: Prediction | string | null
  ): Promise<void> {
    if (!suggestion || typeof suggestion === 'string' || !suggestion.id) return;

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

  // options for unified location box
  const locationOptions: (Geocode | string)[] = needsCity
    ? citySuggestions
    : ['Use current location'];

  return (
    <Stack gap={2}>
      {/* Main search input: drinks / cafes */}
      <Autocomplete
        options={suggestions}
        filterOptions={options =>
          options.filter(o => typeof o !== 'string' && !!o.id)
        }
        freeSolo
        getOptionLabel={() => ''} // keep input blank, we only show text in dropdown
        renderOption={(props, option) => {
          if (typeof option === 'string') return null;
          return (
            <li {...props} key={option.id}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontWeight: 500 }}>{option.name}</span>
                <span style={{ fontSize: '0.85rem', color: '#666' }}>
                  {option.address}
                </span>
              </div>
            </li>
          );
        }}
        onInputChange={(_, value) => {
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

      {/* Unified Location input: current location + city fallback */}
      <Autocomplete
        options={locationOptions}
        freeSolo
        filterOptions={x => x}
        value={null} // control via inputValue only
        inputValue={locationInput}
        onInputChange={(_, value, reason) => {
          if (reason === 'clear') {
            setLocationInput('');
            setActiveCoords(null);
            setCitySuggestions([]);
            setNeedsCity(false);
            setLocationError(null);
            return;
          }

          // typing → treat as city text
          void handleCitySelection(value);
        }}
        onChange={(_, value) => {
          if (!value) return;

          if (typeof value === 'string') {
            if (value === 'Use current location') {
              void handleUseCurrentLocation();
            } else {
              // freeSolo enter: treat as city text
              void handleCitySelection(value);
            }
            return;
          }

          // City suggestion
          void handleCitySelection(value, true);
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
            label="Location"
            placeholder={
              needsCity
                ? 'Enter a city (e.g. San Francisco)'
                : 'Use current location or type a city'
            }
            fullWidth
            error={Boolean(locationError) && !activeCoords}
            helperText={activeCoords ? '' : locationError || ''}
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
