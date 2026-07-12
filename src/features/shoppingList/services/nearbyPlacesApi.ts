import { appConfig } from "../../../config/env";
import { NearbyPlace, NearbyPlaceLocation } from "../types/nearbyPlace";

const GOOGLE_NEARBY_URL = "https://maps.googleapis.com/maps/api/place/nearbysearch/json";
const NEARBY_KEYWORD = "supermarket grocery convenience store market mart";

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

export function getDistanceMeters(from: NearbyPlaceLocation, to: NearbyPlaceLocation) {
  const earthRadiusMeters = 6371000;
  const dLat = toRadians(to.latitude - from.latitude);
  const dLng = toRadians(to.longitude - from.longitude);
  const lat1 = toRadians(from.latitude);
  const lat2 = toRadians(to.latitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(earthRadiusMeters * c);
}

export function buildGoogleMapsUrl(place: NearbyPlace) {
  const query = encodeURIComponent(place.name);
  return `https://www.google.com/maps/search/?api=1&query=${query}&query_place_id=${place.id}`;
}

export function buildCoordinateMapsUrl(location: NearbyPlaceLocation) {
  return `https://www.google.com/maps/search/?api=1&query=${location.latitude},${location.longitude}`;
}

function getDemoPlaces(userLocation: NearbyPlaceLocation): NearbyPlace[] {
  const demoPlaces = [
    {
      id: "demo-fullmartket",
      name: "FullMartket",
      address: "Địa điểm demo",
      latitude: 15.978120601414272,
      longitude: 108.26259527116417,
      rating: 4.4,
      isOpen: true,
    },
    {
      id: "demo-cho-non-nuoc",
      name: "Chợ Non Nước",
      address: "Địa điểm demo",
      latitude: 15.995517803394645,
      longitude: 108.25723647309421,
      rating: 4.1,
      isOpen: true,
    },
    {
      id: "demo-bach-hoa-xanh",
      name: "Bách Hóa Xanh",
      address: "Địa điểm demo",
      latitude: 15.995100096442915,
      longitude: 108.25619377833425,
      rating: 4.0,
      isOpen: true,
    },
  ];

  return demoPlaces.map((place) => {
    const location = {
      latitude: place.latitude,
      longitude: place.longitude,
    };

    return {
      id: place.id,
      name: place.name,
      address: place.address,
      distanceMeters: getDistanceMeters(userLocation, location),
      rating: place.rating,
      isOpen: place.isOpen,
      location,
      source: "DEMO" as const,
    };
  });
}

export async function getNearbyPlacesApi(
  userLocation: NearbyPlaceLocation,
  radiusMeters = 2500
): Promise<NearbyPlace[]> {
  const apiKey = appConfig.googleMapsApiKey;

  if (!apiKey) {
    return getDemoPlaces(userLocation);
  }

  const params = new URLSearchParams({
    key: apiKey,
    location: `${userLocation.latitude},${userLocation.longitude}`,
    radius: String(radiusMeters),
    keyword: NEARBY_KEYWORD,
  });

  const response = await fetch(`${GOOGLE_NEARBY_URL}?${params.toString()}`);
  const payload = await response.json();

  if (!response.ok || !["OK", "ZERO_RESULTS"].includes(payload.status)) {
    return getDemoPlaces(userLocation);
  }

  return (payload.results ?? []).slice(0, 10).map((place: any) => {
    const location = {
      latitude: place.geometry.location.lat,
      longitude: place.geometry.location.lng,
    };

    return {
      id: place.place_id,
      name: place.name,
      address: place.vicinity,
      distanceMeters: getDistanceMeters(userLocation, location),
      rating: place.rating,
      isOpen: place.opening_hours?.open_now,
      location,
      source: "GOOGLE" as const,
    };
  });
}
