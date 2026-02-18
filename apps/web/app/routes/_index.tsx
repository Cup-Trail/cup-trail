import type {
  CategoryRow,
  Geocode,
  Prediction,
  UserCoordinates,
} from '@cuptrail/core';
import { getOrInsertShop } from '@cuptrail/core';
import { getPlaceDetails } from '@cuptrail/maps-api';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import SearchIcon from '@mui/icons-material/Search';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';

import {
  useCafeAutocomplete,
  useCategoryShops,
  useCityAutocomplete,
} from '../hooks';
import { useRecentReviewsQuery } from '../queries';
import AutocompleteInput from '../components/AutocompleteInput';
import ReviewItem from '../components/ReviewItem';
import CategoryFilters from '../components/SearchPage/CategoryFilters';
import Hero from '../components/SearchPage/Hero';

const CURRENT_LOC_LABEL = 'My current location';

export default function SearchRoute() {
  const navigate = useNavigate();

  const [searchInput, setSearchInput] = useState('');
  const [activeCoords, setActiveCoords] = useState<UserCoordinates | null>(
    null
  );

  const [locationInput, setLocationInput] = useState('');
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isUsingCurrentLocation, setIsUsingCurrentLocation] = useState(false);

  const [selecting, setSelecting] = useState(false);
  const [selectError, setSelectError] = useState<string | null>(null);

  const { data: reviews } = useRecentReviewsQuery();

  const {
    items: cafeItems,
    error: cafeError,
    clear: clearCafe,
  } = useCafeAutocomplete({
    query: searchInput,
    coords: activeCoords,
    debounceMs: 250,
  });

  const { items: citySuggestions, clear: clearCities } = useCityAutocomplete({
    query: locationInput,
    debounceMs: 250,
    disabled: isUsingCurrentLocation,
  });

  const {
    selectedCategory,
    shops: categoryShops,
    isLoading: isLoadingShops,
    hasFetched: hasFetchedShops,
    selectCategory,
  } = useCategoryShops();

  function resetLocationState() {
    setActiveCoords(null);
    setLocationError(null);
    setIsUsingCurrentLocation(false);
    clearCities();
  }

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
        setIsUsingCurrentLocation(true);
        clearCities();
      },
      err => {
        setIsUsingCurrentLocation(false);

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

  async function handleSelectSuggestion(
    suggestion: Prediction | string | null
  ): Promise<void> {
    if (!suggestion || typeof suggestion === 'string' || !suggestion.id) return;
    if (selecting) return;

    setSelecting(true);
    setSelectError(null);

    try {
      const apple_place_id = suggestion.id;
      const data = await getPlaceDetails(apple_place_id);
      if (!data) {
        setSelectError('Could not load place details. Please try again.');
        return;
      }

      const { name, formattedAddress, coordinate } = data;
      if (!name || !formattedAddress || !coordinate) {
        setSelectError('Missing place information. Please try another result.');
        return;
      }

      const result = await getOrInsertShop(
        name,
        formattedAddress,
        coordinate.latitude,
        coordinate.longitude,
        apple_place_id
      );

      if (!result?.success) {
        setSelectError('Could not save this shop. Please try again.');
        return;
      }

      const shopId = result.data.id;
      navigate(`/shop/${encodeURIComponent(shopId)}`);
    } catch {
      setSelectError('Something went wrong. Please try again.');
    } finally {
      setSelecting(false);
    }
  }

  async function handleCityPick(item: Geocode | string) {
    if (typeof item === 'string') return;

    const lat = item.coordinate?.latitude;
    const lon = item.coordinate?.longitude;

    if (typeof lat === 'number' && typeof lon === 'number') {
      setActiveCoords({ latitude: lat, longitude: lon });
      setLocationInput(item.name);
      setLocationError(null);
      setIsUsingCurrentLocation(false);
      clearCities();
    }
  }

  useEffect(() => {
    if (!locationInput.trim()) resetLocationState();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationInput]);

  const cafeErrorToShow = cafeError ?? selectError;

  const categorySection = useMemo(() => {
    if (!selectedCategory) return null;

    return (
      <div className='max-w-[1488px] px-6'>
        <h2>Shops for {selectedCategory.label}</h2>

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
                <div className='font-semibold text-text-primary'>{s.name}</div>
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
    );
  }, [selectedCategory, isLoadingShops, hasFetchedShops, categoryShops]);

  const reviewsSection = useMemo(() => {
    if (!reviews) return null;

    return (
      <div className='max-w-[1488px] mx-0 px-6'>
        <h2>Recently Reviewed Shops</h2>

        {reviews.length === 0 ? (
          <p className='mt-2 text-sm text-text-secondary'>No reviews found.</p>
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
    );
  }, [reviews]);

  return (
    <div className='flex flex-col gap-2'>
      <Hero>
        <div className='flex flex-col gap-2'>
          <AutocompleteInput
            placeholder='Search by cafe'
            value={searchInput}
            onChange={v => {
              setSearchInput(v);
              if (!v.trim()) clearCafe();
            }}
            items={searchInput.trim() ? cafeItems : []}
            getKey={o => o.id}
            onSelect={o => {
              void handleSelectSuggestion(o);
              setSearchInput('');
              clearCafe();
            }}
            leftIcon={
              <span className='text-text-secondary'>
                <SearchIcon />
              </span>
            }
            error={cafeErrorToShow}
            renderItem={o => (
              <div className='flex flex-col'>
                <span className='text-sm font-semibold text-text-p'>
                  {o.name}
                </span>
                <span className='text-xs text-text-secondary'>{o.address}</span>
              </div>
            )}
          />

          <AutocompleteInput<Geocode>
            placeholder='Search by current location or city'
            value={locationInput}
            onChange={next => {
              setLocationInput(next);
              setIsUsingCurrentLocation(false);
              if (!next.trim()) return;
            }}
            items={citySuggestions}
            openWhenEmpty={false}
            getKey={item => item.name}
            onSelect={item => {
              void handleCityPick(item);
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
                onClick={() => void handleUseCurrentLocation()}
                className='flex items-center justify-center rounded-full p-1 text-text-secondary hover:text-text-primary transition'
                aria-label='Use current location'
              >
                <MyLocationIcon fontSize='small' />
              </button>
            }
            error={locationError}
          />

          <CategoryFilters
            selectedCategoryId={selectedCategory?.id ?? null}
            onSelectCategory={(c: CategoryRow) => void selectCategory(c)}
            className='mt-4'
          />
        </div>
      </Hero>

      {categorySection}
      {reviewsSection}
    </div>
  );
}
