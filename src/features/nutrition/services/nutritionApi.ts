import { apiClient } from "../../../services/apiClient";
import { RecipeIngredient } from "../../recipes/types/recipe";
import { NutritionCalculation, NutritionFact, NutritionReport } from "../types/nutrition";

export type NutritionFactPayload = {
  foodName: string;
  aliases?: string[];
  categoryId?: string;
  categoryName?: string;
  caloriesPerUnit: number;
  baseQuantity?: number;
  unit: "g" | "kg" | "ml" | "l" | "item" | "serving" | "quả" | "cái";
  protein?: number;
  carbs?: number;
  fat?: number;
  source?: "ADMIN" | "AI_SUGGESTED";
  status?: "OFFICIAL" | "PENDING_REVIEW" | "REJECTED";
};

export const calculateNutritionApi = async (ingredients: RecipeIngredient[]) => {
  const res = await apiClient.post("/api/nutrition/calculate", { ingredients });
  return res.data.data as NutritionCalculation;
};

export const getNutritionReportApi = async (params?: {
  periodType?: "WEEK" | "MONTH";
  startDate?: string;
  endDate?: string;
  ownerType?: "USER" | "HOUSEHOLD";
  householdId?: string;
}) => {
  const res = await apiClient.get("/api/nutrition/report", { params });
  return res.data.data as NutritionReport;
};

export const getNutritionFactsApi = async (params?: { q?: string }) => {
  const res = await apiClient.get("/api/nutrition/facts", { params });
  return res.data.data as NutritionFact[];
};

export const getAdminNutritionFactsApi = async () => {
  const res = await apiClient.get("/api/admin/nutrition-facts");
  return res.data.data as NutritionFact[];
};

export const createAdminNutritionFactApi = async (data: NutritionFactPayload) => {
  const res = await apiClient.post("/api/admin/nutrition-facts", data);
  return res.data.data as NutritionFact;
};

export const updateAdminNutritionFactApi = async (
  id: string,
  data: Partial<NutritionFactPayload>
) => {
  const res = await apiClient.put(`/api/admin/nutrition-facts/${id}`, data);
  return res.data.data as NutritionFact;
};

export const deleteAdminNutritionFactApi = async (id: string) => {
  const res = await apiClient.delete(`/api/admin/nutrition-facts/${id}`);
  return res.data;
};
