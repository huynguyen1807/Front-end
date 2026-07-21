import { apiClient } from '../../../services/apiClient';
import { NearbyPlace, NearbyPlaceLocation } from '../types/nearbyPlace';

export function buildOpenRouteServiceUrl(
  from: NearbyPlaceLocation,
  to: NearbyPlaceLocation
) {
  const coordinates = `${from.longitude},${from.latitude};${to.longitude},${to.latitude}`;
  const data = encodeURIComponent(JSON.stringify({
    coordinates,
    options: { profile: 'driving-car', preference: 'recommended' }
  }));
  return `https://maps.openrouteservice.org/#/directions/${from.latitude},${from.longitude}/${to.latitude},${to.longitude}/data/${data}`;
}

export async function getNearbyPlacesApi(
  userLocation: NearbyPlaceLocation,
  radiusMeters = 2000
): Promise<NearbyPlace[]> {
  const response = await apiClient.get('/api/maps/nearby-stores', {
    params: {
      latitude: userLocation.latitude,
      longitude: userLocation.longitude,
      radius: radiusMeters
    }
  });
  return response.data.data;
}
