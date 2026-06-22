export type FoodRecognition = {
  productName: string;
  category: string;
  confidence: number;
};

export type StorageSuggestion = {
  location: StorageLocation;
  description: string;
  temperature: string;
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
