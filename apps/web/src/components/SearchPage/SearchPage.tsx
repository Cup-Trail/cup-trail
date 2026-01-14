import type {
  CategoryRow,
  Geocode,
  LocationState,
  Prediction,
  ShopRow,
  UserCoordinates,
} from '@cuptrail/core';
import { getOrInsertShop, getShopsByCategorySlug } from '@cuptrail/core';
import {
  getAutocomplete,
  getCityCoords,
  getPlaceDetails,
} from '@cuptrail/utils';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import SearchIcon from '@mui/icons-material/Search';
import { Stack } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useRecentReviewsQuery } from '../../queries';
import AutocompleteInput from '../AutocompleteInput';

import CategoryFilters from './CategoryFilters';
import Hero from './Hero';
import ReviewItem from './ReviewItem';
const CURRENT_LOC_LABEL = 'My current location';
export default function SearchPage() {
  const navigate = useNavigate();

  // shop search

  const [suggestions, setSuggestions] = useState<Prediction[]>([]);
  const suggestionItems = useMemo(
    () => suggestions.filter(s => !!s.id),
    [suggestions]
  );
  const [searchError, setSearchError] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  // unified location state
  const [activeCoords, setActiveCoords] = useState<UserCoordinates | null>(
    null
  );
  const [locationInput, setLocationInput] = useState('');
  const [locationError, setLocationError] = useState<string | null>(null);

  // city mode
  const [citySuggestions, setCitySuggestions] = useState<Geocode[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<CategoryRow | null>(
    null
  );
  const [categoryShops, setCategoryShops] = useState<ShopRow[]>([]);
  const [isLoadingShops, setIsLoadingShops] = useState(false);
  const [hasFetchedShops, setHasFetchedShops] = useState(false);

  const { data: reviews } = useRecentReviewsQuery();
  // options for unified location box
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
  const handleCafeFocus = () => {
    const q = searchInput.trim();
    if (!q) return;
    void handleAutocomplete(q); // this uses latest activeCoords inside
  };
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

      const lat = value.coordinate?.latitude;
      const lon = value.coordinate?.longitude;

      if (typeof lat === 'number' && typeof lon === 'number') {
        setActiveCoords({ latitude: lat, longitude: lon });
        setLocationInput(value.name);
        setLocationError(null);
        setCitySuggestions([]);
      }
      return;
    }

    // Typing city text
    const query = value as string;
    setLocationInput(query);

    if (!query) {
      setCitySuggestions([]);
      setActiveCoords(null);
      return;
    }

    try {
      const preds = await getCityCoords(query);
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

    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      pos => {
        const { latitude, longitude } = pos.coords;
        setActiveCoords({ latitude, longitude });
        setLocationInput(CURRENT_LOC_LABEL);
        setCitySuggestions([]);
      },
      err => {
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

  const handleSelectCategory = async (clickedCategory: CategoryRow) => {
    // toggle off
    if (selectedCategory?.id === clickedCategory.id) {
      setSelectedCategory(null);
      setCategoryShops([]);
      setHasFetchedShops(false);
      return;
    }

    setSelectedCategory(clickedCategory);
    setIsLoadingShops(true);
    setHasFetchedShops(false);

    try {
      const res = await getShopsByCategorySlug(clickedCategory.slug);
      if (res.success) setCategoryShops(res.data);
      else setCategoryShops([]);
    } finally {
      setIsLoadingShops(false);
      setHasFetchedShops(true);
    }
  };
  useEffect(() => {
    const q = searchInput.trim();
    if (!q) return;
    void handleAutocomplete(q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCoords]); // rerun cafe suggestions when location changes
  return (
    <Stack gap={2}>
      <Hero>
        <Stack gap={2}>
          {/* Main search input: drinks / cafes */}
          <AutocompleteInput
            placeholder='Search by cafe'
            value={searchInput}
            onFocus={handleCafeFocus}
            onChange={v => {
              setSearchInput(v);

              if (!v.trim()) {
                setSuggestions([]);
                setSearchError(false);
                return;
              }

              void handleAutocomplete(v);
            }}
            items={searchInput.trim() ? suggestionItems : []}
            getKey={o => o.id}
            onSelect={o => {
              void handleSelectSuggestion(o);
              setSearchInput('');
              setSuggestions([]);
            }}
            leftIcon={
              <span className='text-text-secondary'>
                <SearchIcon />
              </span>
            }
            error={
              searchError ? 'Error getting results. Please try again' : null
            }
            renderItem={o => (
              <div className='flex flex-col'>
                <span className='text-sm font-semibold text-text-p'>
                  {o.name}
                </span>
                <span className='text-xs text-text-secondary'>{o.address}</span>
              </div>
            )}
          />
          {/* Unified Location input: current location + city fallback */}
          <AutocompleteInput<Geocode>
            placeholder='Search by current location or city'
            value={locationInput}
            onChange={next => {
              setLocationInput(next);
              if (!next.trim()) {
                setActiveCoords(null);
                setCitySuggestions([]);
                setLocationError(null);
                return;
              }
              void handleCitySelection(next);
            }}
            items={citySuggestions}
            openWhenEmpty={false}
            getKey={item => item.name}
            onSelect={item => {
              void handleCitySelection(item, true);
            }}
            renderItem={item => (
              <div className='flex flex-col'>
                <span className='text-sm font-medium text-text-primary'>
                  {item.name}
                </span>
                {item.address && (
                  <span className='text-xs text-text-secondary'>
                    {item.address}
                  </span>
                )}
              </div>
            )}
            leftIcon={
              <span className='text-text-secondary'>
                <LocationOnOutlinedIcon />
              </span>
            }
            rightIcon={
              <button
                type='button'
                onClick={async () => {
                  await handleUseCurrentLocation();
                  setLocationInput('My current location');
                  setCitySuggestions([]); // ensure dropdown is empty
                }}
                className='
                  flex items-center justify-center
                  rounded-full p-1
                  text-text-secondary
                  hover:text-text-primary
                  transition
                '
                aria-label='Use current location'
              >
                <MyLocationIcon fontSize='small' />
              </button>
            }
            error={locationError}
          />
          <CategoryFilters
            selectedCategoryId={selectedCategory?.id ?? null}
            onSelectCategory={handleSelectCategory}
            className='mt-4'
          />
        </Stack>
      </Hero>
      {selectedCategory && (
        <>
          <div className='max-w-[1488px] mx-0 px-6'>
            <h2 className='text-lg font-semibold text-text-primary'>
              Shops for {selectedCategory.label}
            </h2>

            {isLoadingShops ? (
              <p className='mt-2 text-sm text-text-secondary'>Loading…</p>
            ) : hasFetchedShops && categoryShops.length === 0 ? (
              <p className='mt-2 text-sm text-text-secondary'>
                No shops match the criteria.
              </p>
            ) : (
              <div className='mt-3 grid gap-3'>
                {categoryShops.map(s => (
                  <div
                    key={String(s.id)}
                    className='rounded-2xl border border-border-default bg-surface-2 p-4'
                  >
                    <div className='font-semibold text-text-primary'>
                      {s.name}
                    </div>
                    {s.address && (
                      <div className='mt-1 text-sm text-text-secondary'>
                        {s.address}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
      {reviews && (
        <div className='max-w-[1488px] mx-0 px-6'>
          <h2 className='text-lg font-semibold text-text-primary'>
            Recently Reviewed Shops
          </h2>

          {reviews.length === 0 ? (
            <p className='mt-2 text-sm text-text-secondary'>
              No recent reviews
            </p>
          ) : (
            <div className='mt-3 grid gap-3'>
              {reviews.map(item => (
                <div
                  key={item.id}
                  className='rounded-2xl border border-border-default bg-surface-2 p-4'
                >
                  <ReviewItem item={item} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Stack>
  );
}
