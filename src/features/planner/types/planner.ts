export type Difficulty = "EASY" | "MEDIUM" | "HARD";
export type RecipeSourceType = "SYSTEM" | "USER_CREATED" | "AI_GENERATED" | "VIDEO_EXTRACTED";
export type MealType = "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK";
export type MealStatus = "COMPLETED" | "PREPARING" | "PENDING";

export interface MacroSummary {
  protein: number;
  carbs: number;
  fat: number;
}

export interface RecipeIngredient {
  ingredientName: string;
  categoryId?: string;
  quantity: number;
  unit: string;
  isRequired?: boolean;
}

export interface Recipe {
  _id: string;
  recipeName: string;
  description?: string;
  imageUrl?: string;
  cookingSteps?: string[];
  cookingTime?: number;
  difficulty: Difficulty;
  calories?: number;
  macroSummary?: MacroSummary;
  tags: string[];
  ingredients: RecipeIngredient[];
  sourceType: RecipeSourceType;
  isActive?: boolean;
}

export interface InventoryFood {
  _id: string;
  foodName: string;
  quantity: number;
  unit: string;
  status: "SAFE" | "NEAR_EXPIRY" | "EXPIRED" | "NEED_CHECK";
  expiryDate: string;
  freshnessScore?: number;
  categoryId?: string | { _id: string; categoryName: string };
  storageLocationId?: string | { _id: string; storageName: string; storageType: string };
}

export interface MealPlanMeal {
  mealType: MealType;
  recipeId?: string | Recipe;
  recipeName: string;
  imageUrl?: string;
  scheduledTime?: string;
  calories?: number;
  macroSummary?: MacroSummary;
  status: MealStatus;
}

export interface MealPlan {
  _id: string;
  planDate: string;
  goal?: string;
  totalCalories?: number;
  macroSummary?: MacroSummary;
  meals: MealPlanMeal[];
  note?: string;
}

export interface MealRecommendation {
  recipe: Recipe;
  score: number;
  matchedFoods: Array<{
    _id: string;
    foodName: string;
    status: string;
    expiryDate: string;
  }>;
}

export interface GeneratedMealPlanResult {
  plan: MealPlan;
  inventoryPriority: Array<{
    _id: string;
    foodName: string;
    quantity: number;
    unit: string;
    status: string;
    expiryDate: string;
    daysUntilExpiry: number;
    categoryName?: string;
  }>;
  recommendations: MealRecommendation[];
  calorieTarget: number;
}

export interface VideoRecipeExtraction {
  source: {
    _id: string;
    videoUrl: string;
    platform: "YOUTUBE" | "TIKTOK" | "FACEBOOK" | "OTHER";
    status: "PROCESSING" | "SUCCESS" | "FAILED";
    extractedIngredients: RecipeIngredient[];
  };
  extractedRecipe: {
    recipeName: string;
    description?: string;
    ingredients: RecipeIngredient[];
    sourceType: "VIDEO_EXTRACTED";
  };
}

export interface NutritionReport {
  _id?: string;
  periodType: "WEEK" | "MONTH";
  startDate: string;
  endDate: string;
  totalCalories: number;
  averageCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  dailySummary: Array<{
    date: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  }>;
}

export interface NutritionFact {
  _id: string;
  foodName: string;
  categoryId?: string | { _id: string; categoryName: string };
  caloriesPerUnit: number;
  unit: "g" | "ml" | "item" | "serving";
  protein: number;
  carbs: number;
  fat: number;
  source: "ADMIN" | "AI_SUGGESTED";
  status: "OFFICIAL" | "PENDING_REVIEW" | "REJECTED";
}

export interface FoodCategoryData {
  _id: string;
  categoryName: string;
  description?: string;
  isActive: boolean;
}

export type StorageRuleType = "REFRIGERATOR" | "OUTSIDE" | "FREEZER" | "PANTRY" | "KITCHEN_CABINET";

export interface StorageRuleData {
  _id: string;
  categoryId: string | { _id: string; categoryName: string };
  storageType: StorageRuleType;
  estimatedDays: number;
  instruction?: string;
  warningMessage?: string;
  priority: number;
  source: "ADMIN" | "AI_SUGGESTED";
  status: "OFFICIAL" | "PENDING_REVIEW" | "REJECTED";
}

export interface AiGeneratedData {
  _id: string;
  dataType: "STORAGE_RULE" | "RECIPE" | "NUTRITION_FACT" | "FOOD_CATEGORY";
  generatedContent: Record<string, any>;
  status: "PENDING_REVIEW" | "APPROVED" | "REJECTED";
  reviewNote?: string;
  createdAt?: string;
}

export interface NutritionCalculation {
  calories: number;
  macroSummary: MacroSummary;
  details: Array<{
    ingredientName: string;
    calories: number;
    macroSummary: MacroSummary;
  }>;
  unmatched: Array<{
    ingredientName: string;
    quantity: number;
    unit?: string;
  }>;
}

export interface ScheduleDate {
  id: string;
  label: string;
  value: string;
}
