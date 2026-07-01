import { apiClient } from "../../../services/apiClient";
import { Recipe, RecipeIngredient } from "../types/recipe";

export type RecipePayload = {
  recipeName: string;
  description?: string;
  imageUrl?: string;
  cookingSteps?: string[];
  cookingTime?: number;
  difficulty?: "EASY" | "MEDIUM" | "HARD";
  calories?: number;
  macroSummary?: {
    protein: number;
    carbs: number;
    fat: number;
  };
  tags?: string[];
  ingredients?: RecipeIngredient[];
  sourceType?: "SYSTEM" | "USER_CREATED" | "AI_GENERATED" | "VIDEO_EXTRACTED";
  recalculateNutrition?: boolean;
};

export const getAdminRecipesApi = async () => {
  const res = await apiClient.get("/api/admin/recipes");
  return res.data.data as Recipe[];
};

export const createAdminRecipeApi = async (data: RecipePayload) => {
  const res = await apiClient.post("/api/admin/recipes", data);
  return res.data.data as Recipe;
};

export const updateAdminRecipeApi = async (id: string, data: Partial<RecipePayload>) => {
  const res = await apiClient.put(`/api/admin/recipes/${id}`, data);
  return res.data.data as Recipe;
};

export const deleteAdminRecipeApi = async (id: string) => {
  const res = await apiClient.delete(`/api/admin/recipes/${id}`);
  return res.data;
};
