import type { Prediction } from '@cuptrail/core';
import { getOrInsertShop } from '@cuptrail/core';
import { getPlaceDetails } from '@cuptrail/maps-api';
import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router';

export default function useShopNavigation() {
  const navigate = useNavigate();
  const [isNavigating, setIsNavigating] = useState(false);

  const goToShopFromPrediction = useCallback(
    async (suggestion: Prediction) => {
      if (!suggestion?.id) return;

      try {
        setIsNavigating(true);

        const apple_place_id = suggestion.id;
        const data = await getPlaceDetails(apple_place_id);
        if (!data) return;

        const { name, formattedAddress, coordinate } = data;
        if (!name || !formattedAddress || !coordinate) return;

        const result = await getOrInsertShop(
          name,
          formattedAddress,
          coordinate.latitude,
          coordinate.longitude,
          apple_place_id
        );

        if (!result.success) return;

        const shopId = result.data.id;
        if (!shopId) return;

        navigate(`/shop/${encodeURIComponent(shopId)}`);
      } finally {
        setIsNavigating(false);
      }
    },
    [navigate]
  );

  return { goToShopFromPrediction, isNavigating };
}
