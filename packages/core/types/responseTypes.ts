export interface PlaceDetails {
  name: string;
  formattedAddress: string;
  coordinate: {
    latitude: number;
    longitude: number;
  };
}

export interface Prediction {
  id: string;
  name: string;
  address: string;
}

export interface UserCoordinates {
  latitude: number;
  longitude: number;
}

export interface Geocode {
  name: string;
  address: string;
  coordinate: {
    latitude: number;
    longitude: number;
  };
}
