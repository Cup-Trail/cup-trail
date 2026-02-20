export interface AutocompleteResult {
  id: string;
  completionUrl: string; // api url
  displayLines: string[];
  location: {
    latitude: number;
    longitude: number;
  };
  structuredAddress: {
    administrativeArea: string;
    administrativeAreaCode: string;
    locality: string;
    postCode: string;
    subLocality: string;
    thoroughfare: string;
    subThoroughfare: string;
    fullThoroughfare: string;
    dependentLocalities: string[];
  };
}
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
