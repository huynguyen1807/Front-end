// Types match backend API response
export type FoodStatus = 'SAFE' | 'NEAR_EXPIRY' | 'EXPIRED' | 'NEED_CHECK';
export type StorageTypeBackend = 'REFRIGERATOR' | 'OUTSIDE' | 'FREEZER' | 'PANTRY' | 'KITCHEN_CABINET' | 'CUSTOM';
export type InventoryFilter = 'all' | 'SAFE' | 'NEAR_EXPIRY' | 'EXPIRED';

// Legacy UI filter (dùng trong filter chips)
export type UIFilter = 'all' | 'fridge' | 'outside' | 'expiring';

export type FoodCategory = {
  _id: string;
  categoryName: string;
  description?: string;
};

export type StorageLocation = {
  _id: string;
  storageName: string;
  storageType: StorageTypeBackend;
  isDefault: boolean;
};

export type FoodItem = {
  _id: string;
  foodName: string;
  imageUrl?: string;
  quantity: number;
  unit: string;
  status: FoodStatus;
  freshnessScore: number;
  expiryDate: string;
  purchaseDate: string;
  sourceType: 'SUPERMARKET' | 'MARKET';
  expiryType: 'MANUAL' | 'SCANNED' | 'AI_PREDICTED';
  categoryId: FoodCategory;
  storageLocationId: StorageLocation;
};

export type FoodSummary = {
  total: number;
  safe: number;
  nearExpiry: number;
  expired: number;
};

export type StorageSuggestion = {
  bestStorageType: StorageTypeBackend;
  estimatedDays: number;
  instruction?: string;
  warningMessage?: string;
  suggestions: {
    storageType: StorageTypeBackend;
    estimatedDays: number;
    instruction?: string;
    matchedLocations: StorageLocation[];
  }[];
};

// Legacy type cho InventoryCard (UI cũ)
export type InventoryItem = {
  id: string;
  name: string;
  quantity: string;
  storageLabel: string;
  storageType: 'fridge' | 'outside' | 'freezer';
  daysLeft: number;
  freshnessPercent: number;
  imageUrl: string;
};