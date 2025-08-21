import { ShopRow } from '.';

export type ShopsByCategoryResponse = {
  shop_drinks?: { shops?: ShopRow };
};

export interface PlaceDetailsAPIResponse {
  result: {
    place_id: string;
    name: string;
    formatted_address: string;
    geometry: {
      location: {
        lat: number;
        lng: number;
      };
    };
  };
  status: string;
}
