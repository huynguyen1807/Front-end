import { apiClient } from "../../../services/apiClient";
import {
  BmiProfile,
  GeneratedMealPlanResult,
  InventoryFood,
  MealPlan,
  MealPlanMeal,
  Recipe,
  RecipeIngredient,
  VideoRecipeExtraction,
} from "../types/planner";

export type MealPlanPayload = {
  planDate: string;
  ownerType?: "USER" | "HOUSEHOLD";
  householdId?: string;
  goal?: string;
  note?: string;
  meals: MealPlanMeal[];
};

export const getRecipesApi = async (params?: { q?: string; mine?: boolean }) => {
  const res = await apiClient.get("/api/recipes", {
    params: { ...params, mine: params?.mine ? "true" : undefined },
  });
  return res.data.data as Recipe[];
};

export const dismissRecipeRecommendationApi = async (recipeId: string) => {
  const res = await apiClient.patch(`/api/recipes/${recipeId}/recommendation/dismiss`);
  return res.data;
};

export const getMealPlansApi = async (params?: {
  date?: string;
  startDate?: string;
  endDate?: string;
  ownerType?: "USER" | "HOUSEHOLD";
  householdId?: string;
}) => {
  const res = await apiClient.get("/api/meal-plans", { params });
  return res.data.data as MealPlan[];
};

export const generateDailyMealPlanApi = async (data: {
  planDate: string;
  calorieTarget?: number;
  calorieMin?: number;
  calorieMax?: number;
  mealTypes?: string[];
  goal?: string;
  bmiProfile?: BmiProfile;
  avoidRecipes?: Array<{
    recipeName?: string;
    ingredients?: RecipeIngredient[];
    cookingSteps?: string[];
    tags?: string[];
  }>;
  ownerType?: "USER" | "HOUSEHOLD";
  householdId?: string;
}) => {
  const res = await apiClient.post("/api/meal-plans/generate", data);
  return res.data.data as GeneratedMealPlanResult;
};

export const updateUserPreferencesApi = async (data: {
  calorieTarget?: number;
  dietaryGoal?: string;
  dislikedFoods?: string[];
  allergies?: string[];
  preferredCuisines?: string[];
  numberOfPeople?: number;
  defaultMealTypes?: string[];
}) => {
  const res = await apiClient.put("/api/users/preferences", data);
  return res.data.preferences;
};

export const extractRecipeFromVideoApi = async (data: {
  videoUrl: string;
  recipeName?: string;
  ingredients?: RecipeIngredient[];
}) => {
  const res = await apiClient.post("/api/meal-plans/video-extract", data);
  return res.data.data as VideoRecipeExtraction;
};

export const createMealPlanApi = async (data: MealPlanPayload) => {
  const res = await apiClient.post("/api/meal-plans", data);
  return res.data.data as MealPlan;
};

export const addMealToPlanApi = async (data: Omit<MealPlanPayload, "meals"> & {
  meal: MealPlanMeal;
}) => {
  const res = await apiClient.post("/api/meal-plans/meals", data);
  return res.data.data as MealPlan;
};

export const updateMealPlanApi = async (id: string, data: Partial<MealPlanPayload>) => {
  const res = await apiClient.put(`/api/meal-plans/${id}`, data);
  return res.data.data as MealPlan;
};

export const deleteMealPlanApi = async (id: string) => {
  const res = await apiClient.delete(`/api/meal-plans/${id}`);
  return res.data;
};

export const getAvailableFoodsApi = async (context?: {
  ownerType: "USER" | "HOUSEHOLD";
  householdId?: string;
}) => {
  const res = await apiClient.get("/api/foods", { params: context });
  return res.data.data as InventoryFood[];
};

export const addMissingIngredientsToShoppingListApi = async (
  items: Array<{
    ingredientName: string;
    categoryId?: string;
    quantity: number;
    unit: string;
  }>
) => {
  const res = await apiClient.post("/api/shopping-lists/missing-ingredients", { items });
  return res.data.data;
};
