export interface NearbyPlaceLocation {
  latitude: number;
  longitude: number;
}

export interface NearbyPlace {
  id: string;
  name: string;
  address?: string;
  distanceMeters: number;
  rating?: number;
  isOpen?: boolean;
  location: NearbyPlaceLocation;
  source: "GOOGLE" | "DEMO";
}
