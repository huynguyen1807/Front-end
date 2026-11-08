export type FoodRecognition = {
  boundingBox?: BoundingBox;
  visibility?: 'CLEAR' | 'PACKAGED' | 'OCCLUDED';
  foodState?: FoodState;
  storageGuide?: StorageGuide | null;
  productName: string;
  category: string;
  confidence: number;
  isFood?: boolean;
  normalizedName?: string;
  categoryId?: string;
  categoryName?: string;
  candidates?: FoodRecognitionCandidate[];
  visualEvidence?: string[];
  estimatedQuantity?: {
    quantity: number;
    unit: string;
  };
  storageSuggestion?: StorageSuggestion;
  expiryEstimate?: {
    predictedDays: number;
    expiryDate: string;
    explanation?: string;
  };
  nutritionEstimate?: NutritionInfo;
  warnings?: string[];
  errorCode?: string;
  providerError?: string;
  retryAfterSeconds?: number;
  modelAttempts?: string[];
  aiProvider?: string;
  modelUsed?: string;
  inventoryContext?: {
    ownerType: 'USER' | 'HOUSEHOLD';
    householdId?: string;
  };
};

export type FoodRecognitionCandidate = {
  foodName: string;
  normalizedName?: string;
  categoryId?: string;
  categoryName?: string;
  confidence: number;
  reason?: string;
};

export type StorageSuggestion = {
  location: StorageLocation;
  storageType?: string;
  storageLocationId?: string;
  description: string;
  temperature: string;
  estimatedDays?: number;
};

export type MealSuggestion = {
  dishName: string;
  ingredients: string[];
  cookingTime: number;
  difficulty: "easy" | "medium" | "hard";
  missingIngredients?: string[];
};

export type NutritionInfo = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  source?: string;
  matched?: boolean;
};

export type ScanResult = {
  id: string;
  // Food Recognition
  foodRecognition: FoodRecognition;
  
  // Expiry Date Prediction
  aiPredictedDays: number;
  expiryDate: string;
  
  // Storage Suggestion
  storageSuggestion: StorageSuggestion;
  
  // Meal Suggestions
  mealSuggestions: MealSuggestion[];
  
  // Nutrition Info
  nutritionInfo?: NutritionInfo;
  
  // Original Image
  imageUrl: string;
};

export type StorageLocation = "fridge" | "outside" | "freezer";

export const STORAGE_LOCATIONS = {
  fridge: "Tủ lạnh",
  outside: "Bên ngoài",
  freezer: "Ngăn đông",
} as const;

export type ScanPhoto = { uri: string; width: number; height: number; source: 'camera' | 'library' };
export type ScanStage = 'preparing' | 'uploading' | 'queued' | 'recognizing' | 'enriching' | 'finishing' | 'completed';
export type ScanProgress = { stage: ScanStage; percent: number };
export type ScanBatch = {
  jobId: string;
  scanResultId: string;
  capturedAt: string;
  width: number;
  height: number;
  results: ScanResult[];
  imageUrl: string;
  warnings: string[];
  inventoryContext: { ownerType: 'USER' | 'HOUSEHOLD'; householdId?: string };
};

export type BoundingBox = [number, number, number, number];
export type FoodState = 'RAW' | 'COOKED' | 'UNKNOWN';
export type StorageGuide = { minDays: number; maxDays: number; label: string; temperature: string; kind: 'QUALITY' | 'REFRIGERATED_WINDOW'; sourceUrl: string; conditions: string; sourceLabel?: string; dateAnchor?: 'PURCHASE' | 'HANDLING' };
export type StorageAdvice = { guide: StorageGuide | null; message: string; profiles: { value: string; label: string }[]; recommendedStorage?: string };
export type ScanDraftItem = {
  clientItemId: string; sourceScanId: string; foodName: string; categoryId: string;
  quantity: string; unit: string; storageType: string; foodState: FoodState;
  packaging: 'SEALED' | 'OPENED' | 'PORTIONED' | 'UNKNOWN'; containerLabel: string;
  storageProfile?: string;
  storageStartedAt: string; expiryDate: string; expiryBasis: 'REFERENCE' | 'PACKAGE' | 'USER';
  packageExpiryDate?: string;
  guide?: StorageGuide | null; boundingBox?: BoundingBox; imageMode: 'CROP' | 'NONE';
  selected: boolean; saved: boolean; identityConfirmed: boolean; confidence?: number;
  saveUncertain?: boolean;
  visibility?: 'CLEAR' | 'PACKAGED' | 'OCCLUDED'; manual: boolean; error?: string;
  duplicateDecision: 'REVIEW' | 'NEW_LOT';
};
export type ScanReviewSession = {
  root: ScanBatch; sources: Record<string, ScanBatch>; items: ScanDraftItem[];
  purchaseDate: string; sourceType: 'SUPERMARKET' | 'MARKET';
  sourceKind?: 'RECEIPT';
};
