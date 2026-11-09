import { StorageLocation, StorageTypeBackend } from '../types/inventory';

type StoragePreference = {
  locationId?: string;
  storageType?: string;
};

export function findStorageLocation(
  locations: StorageLocation[],
  preference: StoragePreference,
) {
  const preferredType = preference.storageType as StorageTypeBackend | undefined;
  const exactMatch = locations.find((location) => location._id === preference.locationId);
  if (exactMatch) return exactMatch;

  const typeMatch = locations.find(
    (location) => preferredType && location.storageType === preferredType,
  );
  if (typeMatch || preference.locationId || preferredType) return typeMatch;

  return locations.find((location) => location.isDefault) || locations[0];
}

export function isSameInventoryContext(
  left: { ownerType: string; householdId?: string },
  right: { ownerType: string; householdId?: string },
) {
  return left.ownerType === right.ownerType && left.householdId === right.householdId;
}
