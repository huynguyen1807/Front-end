export type FoodRecognition = {
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
