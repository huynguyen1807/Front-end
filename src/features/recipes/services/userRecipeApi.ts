import { apiClient } from "../../../services/apiClient";
import { Recipe, RecipeIngredient } from "../types/recipe";

export type UserRecipePayload = {
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
  recalculateNutrition?: boolean;
};

export const getUserRecipesApi = async () => {
  const res = await apiClient.get("/api/recipes", { params: { mine: "true" } });
  return res.data.data as Recipe[];
};

export const createUserRecipeApi = async (data: UserRecipePayload) => {
  const res = await apiClient.post("/api/recipes", data);
  return res.data.data as Recipe;
};

export const updateUserRecipeApi = async (id: string, data: Partial<UserRecipePayload>) => {
  const res = await apiClient.put(`/api/recipes/${id}`, data);
  return res.data.data as Recipe;
};

export const deleteUserRecipeApi = async (id: string) => {
  const res = await apiClient.delete(`/api/recipes/${id}`);
  return res.data;
};
