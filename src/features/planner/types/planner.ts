export type Difficulty = "EASY" | "MEDIUM" | "HARD";
export type RecipeSourceType = "SYSTEM" | "USER_CREATED" | "AI_GENERATED" | "VIDEO_EXTRACTED";
export type MealType =
  | "BREAKFAST"
  | "LUNCH"
  | "AFTERNOON"
  | "DINNER"
  | "LATE_NIGHT"
  | "SNACK";
export type MealStatus = "COMPLETED" | "PREPARING" | "PENDING";

export interface MacroSummary {
  protein: number;
  carbs: number;
  fat: number;
}

export interface RecipeIngredient {
  ingredientName: string;
  categoryId?: string;
  categoryName?: string;
  quantity: number;
  unit: string;
  isRequired?: boolean;
}

export type RecipeAvailabilityStatus = "ENOUGH_INGREDIENTS" | "MISSING_INGREDIENTS";

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
  availability?: RecipeAvailability;
  availabilityStatus?: RecipeAvailabilityStatus;
  missingIngredients?: RecipeIngredient[];
  targetMealType?: MealType;
  targetCalories?: number;
  calorieRange?: {
    min: number;
    max?: number;
  };
}

export interface InventoryFood {
  _id: string;
  foodName: string;
  imageUrl?: string;
  quantity: number;
  unit: string;
  status: "SAFE" | "NEAR_EXPIRY" | "EXPIRED" | "NEED_CHECK";
  expiryDate: string;
  freshnessScore?: number;
  calories?: number;
  macroSummary?: MacroSummary;
  nutrition?: {
    calories: number;
    macroSummary: MacroSummary;
    matched: boolean;
    nutritionFactId?: string;
    unit?: string;
  };
  categoryId?: string | { _id: string; categoryName: string } | null;
  storageLocationId?: string | { _id: string; storageName: string; storageType: string };
}

export interface UsedFoodUsage {
  foodItemId: string | InventoryFood;
  foodName: string;
  quantityUsed: number;
  unit: string;
  calories?: number;
  macroSummary?: MacroSummary;
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
  usedFoodItemIds?: string[];
  usedFoods?: UsedFoodUsage[];
  inventoryApplied?: boolean;
}

export interface MealPlan {
  _id: string;
  inventoryOwnerType?: "USER" | "HOUSEHOLD";
  householdId?: string;
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
  availabilityStatus?: RecipeAvailabilityStatus;
  missingIngredients?: RecipeIngredient[];
  targetMealType?: MealType;
  targetCalories?: number;
  calorieRange?: {
    min: number;
    max?: number;
  };
  matchedFoods: Array<{
    _id: string;
    foodName: string;
    status: string;
    expiryDate: string;
  }>;
  priorityReasons?: string[];
}

export interface GeneratedMealPlanResult {
  plan?: MealPlan | null;
  generatedRecipes?: Recipe[];
  inventoryPriority: Array<{
    _id: string;
    foodName: string;
    quantity: number;
    unit: string;
    status: string;
    expiryDate: string;
    daysUntilExpiry: number;
    categoryName?: string;
    calories?: number;
    macroSummary?: MacroSummary;
  }>;
  recommendations: MealRecommendation[];
  planDate?: string;
  calorieTarget: number;
  calorieRange?: {
    min: number;
    max?: number;
  };
  mealCalorieAllocations?: Array<{
    mealType: MealType;
    min: number;
    max?: number;
    target: number;
  }>;
  generatedCaloriesTotal?: number;
}

export interface BmiProfile {
  weightKg: number;
  heightCm: number;
  age?: number;
  gender?: "MALE" | "FEMALE" | "OTHER";
  activityLevel?: "LOW" | "MODERATE" | "HIGH";
  goal?: "MAINTAIN" | "WEIGHT_LOSS" | "MUSCLE_GAIN" | "HEALTHY_EATING";
  bmi: number;
  category: "UNDERWEIGHT" | "NORMAL" | "OVERWEIGHT" | "OBESE";
  categoryLabel: string;
}

export interface RecipeAvailability {
  canSchedule: boolean;
  matchedIngredients: string[];
  missingIngredients: string[];
}

export interface VideoRecipeExtraction {
  source: {
    _id: string;
    videoUrl: string;
    platform: "YOUTUBE" | "TIKTOK" | "FACEBOOK" | "OTHER";
    status: "PROCESSING" | "SUCCESS" | "FAILED";
    extractedIngredients: RecipeIngredient[];
  };
  recipe?: {
    _id: string;
    recipeName: string;
  };
  extractedRecipe: {
    recipeId?: string;
    recipeName: string;
    description?: string;
    ingredients: RecipeIngredient[];
    cookingSteps: string[];
    cookingTime?: number;
    difficulty?: Difficulty;
    calories?: number;
    servings?: number;
    cuisine?: string;
    macroSummary?: MacroSummary;
    tags?: string[];
    notes?: string;
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
  categoryId?: string | { _id: string; categoryName: string } | null;
  caloriesPerUnit: number;
  baseQuantity: number;
  aliases?: string[];
  unit: "g" | "kg" | "ml" | "l" | "item" | "serving" | "quả" | "cái";
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
  categoryId: string | { _id: string; categoryName: string } | null;
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
