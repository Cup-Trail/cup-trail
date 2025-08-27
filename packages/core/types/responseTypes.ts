export interface PlaceDetails {
  displayName: string;
  formattedAddress: string;
  location: {
    latitude: number;
    longitude: number;
  };
}

export interface Prediction {
  placeId: string;
  text: string;
  structuredFormat: {
    mainText: string;
    secondaryText: string;
  };
}
