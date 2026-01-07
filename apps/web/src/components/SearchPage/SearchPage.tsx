import type {
  CategoryRow,
  Geocode,
  LocationState,
  Prediction,
  ShopRow,
  UserCoordinates,
} from "@cuptrail/core";
import { getOrInsertShop, getShopsByCategorySlug } from "@cuptrail/core";
import {
  getAutocomplete,
  getCityCoords,
  getPlaceDetails,
} from "@cuptrail/utils";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import SearchIcon from "@mui/icons-material/Search";
import {
  Autocomplete,
  CircularProgress,
  Stack,
  TextField,
} from "@mui/material";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { useRecentReviewsQuery } from "../../queries";
import CategoryFilters from "./CategoryFilters";
import Hero from "./Hero";
import ReviewItem from "./ReviewItem";
const CURRENT_LOC_LABEL = "Use current location";
export default function SearchPage() {
  const navigate = useNavigate();

  // shop search
  const [suggestions, setSuggestions] = useState<Prediction[]>([]);
  const [searchError, setSearchError] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  // unified location state
  const [activeCoords, setActiveCoords] = useState<UserCoordinates | null>(
    null,
  );
  const [locationInput, setLocationInput] = useState("");
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLocLoading, setIsLocLoading] = useState(false);

  // city mode
  // const [needsCity, setNeedsCity] = useState(false);
  const [citySuggestions, setCitySuggestions] = useState<Geocode[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<CategoryRow | null>(
    null,
  );
  const [categoryShops, setCategoryShops] = useState<ShopRow[]>([]);
  const [isLoadingShops, setIsLoadingShops] = useState(false);
  const [hasFetchedShops, setHasFetchedShops] = useState(false);

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
    fromSelect: boolean = false,
  ): Promise<void> {
    // Selected a city from the list
    if (fromSelect) {
      if (typeof value === "string") return;

      const lat = value.coordinate?.latitude;
      const lon = value.coordinate?.longitude;

      if (typeof lat === "number" && typeof lon === "number") {
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
    if (!("geolocation" in navigator)) {
      setLocationError("Location not supported on this device.");
      return;
    }

    setIsLocLoading(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setActiveCoords({ latitude, longitude });
        setLocationInput(CURRENT_LOC_LABEL);
        setCitySuggestions([]);
        setIsLocLoading(false);
      },
      (err) => {
        setIsLocLoading(false);
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setLocationError(
              "Please allow location access in your browser or choose a city.",
            );
            break;
          case err.POSITION_UNAVAILABLE:
            setLocationError("Location is currently unavailable.");
            break;
          case err.TIMEOUT:
            setLocationError("Timed out trying to get your location.");
            break;
          default:
            setLocationError("Could not get your location.");
        }
        setActiveCoords(null);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5 * 60 * 1000,
      },
    );
  }

  /** Shop selection */
  async function handleSelectSuggestion(
    suggestion: Prediction | string | null,
  ): Promise<void> {
    if (!suggestion || typeof suggestion === "string" || !suggestion.id) return;

    try {
      const data = await getPlaceDetails(suggestion.id);
      if (!data) return;

      const { name, formattedAddress, coordinate } = data;

      if (name && formattedAddress && coordinate) {
        const result = await getOrInsertShop(
          name,
          formattedAddress,
          coordinate.latitude,
          coordinate.longitude,
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
  // options for unified location box
  const locationOptions: (Geocode | string)[] = [
    CURRENT_LOC_LABEL,
    ...citySuggestions,
  ];
  return (
    <Stack gap={2}>
      <Hero>
        <Stack gap={2}>
          {/* Main search input: drinks / cafes */}
          <Autocomplete
            options={suggestions}
            filterOptions={(options) => options.filter((o) => !!o.id)}
            freeSolo
            inputValue={searchInput}
            getOptionLabel={() => ""} // keep input blank, we only show text in dropdown
            open={Boolean(searchInput.trim()) && suggestions.length > 0}
            renderOption={(props, option) => {
              if (typeof option === "string") return null;
              return (
                <li {...props} key={option.id}>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <span style={{ fontWeight: 500 }}>{option.name}</span>
                    <span style={{ fontSize: "0.85rem", color: "#666" }}>
                      {option.address}
                    </span>
                  </div>
                </li>
              );
            }}
            onInputChange={(_, value) => {
              setSearchInput(value);

              // Clear via X button or manual backspace to empty
              if (!value.trim()) {
                setSuggestions([]);
                setSearchError(false);
                return;
              }

              // Otherwise, fetch suggestions
              void handleAutocomplete(value);
            }}
            onChange={(_, s) => {
              void handleSelectSuggestion(s);
              setSearchInput("");
              setSuggestions([]);
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Search by cafe"
                fullWidth
                error={searchError}
                helperText={searchError
                  ? "Error getting results. Please try again"
                  : ""}
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
            filterOptions={(x) => x}
            value={null} // control via inputValue only
            inputValue={locationInput}
            onInputChange={(_, value, reason) => {
              if (reason === "clear") {
                setLocationInput("");
                setActiveCoords(null);
                setCitySuggestions([]);
                setLocationError(null);
                return;
              }

              // typing → treat as city text
              void handleCitySelection(value);
            }}
            onChange={(_, value) => {
              if (!value) return;

              if (typeof value === "string") {
                if (value === CURRENT_LOC_LABEL) {
                  void handleUseCurrentLocation();
                } else {
                  // freeSolo enter: treat as city text
                  void handleCitySelection(value);
                }
                return;
              }

              // City suggestion (Geocode)
              void handleCitySelection(value, true);
            }}
            getOptionLabel={(option) =>
              typeof option === "string" ? option : option.name}
            renderOption={(props, option) => {
              if (typeof option === "string") {
                return (
                  <li {...props} key={option}>
                    {option}
                  </li>
                );
              }
              return (
                <li {...props} key={option.name}>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <span style={{ fontWeight: 500 }}>{option.name}</span>
                    {option.address && (
                      <span style={{ fontSize: "0.85rem", color: "#666" }}>
                        {option.address}
                      </span>
                    )}
                  </div>
                </li>
              );
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Location"
                placeholder={"Use current location or type a city"}
                fullWidth
                error={Boolean(locationError) && !activeCoords}
                helperText={activeCoords ? "" : locationError || ""}
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
          <CategoryFilters
            selectedCategoryId={selectedCategory?.id ?? null}
            onSelectCategory={handleSelectCategory}
            className="mt-4"
          />
        </Stack>
      </Hero>
      {selectedCategory && (
        <>
          <div className="max-w-[1488px] mx-0 px-6">
            <h2 className="text-lg font-semibold text-text-primary">
              Shops for {selectedCategory.label}
            </h2>

            {isLoadingShops
              ? (
                <p className="mt-2 text-sm text-text-secondary">
                  Loading…
                </p>
              )
              : hasFetchedShops && categoryShops.length === 0
              ? (
                <p className="mt-2 text-sm text-text-secondary">
                  No shops match the criteria.
                </p>
              )
              : (
                <div className="mt-3 grid gap-3">
                  {categoryShops.map((s) => (
                    <div
                      key={String(s.id)}
                      className="rounded-2xl border border-border-default bg-surface-2 p-4"
                    >
                      <div className="font-semibold text-text-primary">
                        {s.name}
                      </div>
                      {s.address && (
                        <div className="mt-1 text-sm text-text-secondary">
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
        <div className="max-w-[1488px] mx-0 px-6">
          <h2 className="text-lg font-semibold text-text-primary">
            Recently Reviewed Shops
          </h2>

          {reviews.length === 0
            ? (
              <p className="mt-2 text-sm text-text-secondary">
                No recent reviews
              </p>
            )
            : (
              <div className="mt-3 grid gap-3">
                {reviews.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-border-default bg-surface-2 p-4"
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
