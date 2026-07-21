// Types match backend API response
export type FoodStatus = 'SAFE' | 'NEAR_EXPIRY' | 'EXPIRED' | 'NEED_CHECK';
export type StorageTypeBackend = 'REFRIGERATOR' | 'OUTSIDE' | 'FREEZER' | 'PANTRY' | 'KITCHEN_CABINET' | 'CUSTOM';
export type InventoryFilter = 'all' | 'SAFE' | 'NEAR_EXPIRY' | 'EXPIRED' | 'NEED_CHECK';

// Legacy UI filter (dùng trong filter chips)
export type UIFilter = 'all' | 'fridge' | 'outside' | 'expiring';

export type FoodCategory = {
  _id: string;
  categoryName: string;
  displayName?: string;
  description?: string;
  aliases?: string[];
  keywords?: string[];
  foodExamples?: string[];
  sortOrder?: number;
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
  categoryWarning?: string;
  recommendedCategoryName?: string;
  calories?: number;
  macroSummary?: {
    protein: number;
    carbs: number;
    fat: number;
  };
  nutrition?: {
    calories: number;
    macroSummary: {
      protein: number;
      carbs: number;
      fat: number;
    };
    matched: boolean;
    nutritionFactId?: string;
    unit?: string;
    baseQuantity?: number;
    source?: 'NUTRITION_FACT' | 'SCAN_AI' | 'ADMIN' | 'CATEGORY_ESTIMATE' | 'UNAVAILABLE';
    estimated?: boolean;
  };
  nutritionSnapshot?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    baseQuantity: number;
    unit: string;
    source: 'SCAN_AI' | 'ADMIN' | 'CATEGORY_ESTIMATE';
    confidence?: number;
  };
  expiryDate: string;
  purchaseDate: string;
  sourceType: 'SUPERMARKET' | 'MARKET';
  expiryType: 'MANUAL' | 'SCANNED' | 'AI_PREDICTED';
  categoryId: FoodCategory;
  storageLocationId: StorageLocation;
  isConsumed?: boolean;
  consumedAt?: string;
};

export type FoodSummary = {
  total: number;
  safe: number;
  nearExpiry: number;
  expired: number;
  needCheck?: number;
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
