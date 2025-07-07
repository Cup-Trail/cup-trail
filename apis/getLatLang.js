import axios from 'axios';
import { GOOGLE_API_KEY } from '@env';

export async function getLatLngFromAddress(address) {
  try {
    const encodedAddress = encodeURIComponent(address);
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${GOOGLE_API_KEY}`;

    const response = await axios.get(url);
    const result = response.data.results[0];

    if (!result) {
      console.warn('No geocode results for address:', address);
      return { lat: null, lng: null };
    }

    const { lat, lng } = result.geometry.location;
    return { lat, lng };
  } catch (err) {
    console.error('Failed to geocode address:', err);
    return { lat: null, lng: null };
  }
}
