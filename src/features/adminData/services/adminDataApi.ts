import { apiClient } from "../../../services/apiClient";
import {
  AiGeneratedData,
  FoodCategoryData,
  StorageRuleData,
  StorageRuleType,
} from "../../planner/types/planner";

export type FoodCategoryPayload = {
  categoryName: string;
  description?: string;
  isActive?: boolean;
};

export type StorageRulePayload = {
  categoryId?: string;
  categoryName?: string;
  storageType: StorageRuleType;
  estimatedDays: number;
  instruction?: string;
  warningMessage?: string;
  priority?: number;
  source?: "ADMIN" | "AI_SUGGESTED";
  status?: "OFFICIAL" | "PENDING_REVIEW" | "REJECTED";
};

export const getAdminFoodCategoriesApi = async () => {
  const res = await apiClient.get("/api/admin/food-categories");
  return res.data.data as FoodCategoryData[];
};

export const createAdminFoodCategoryApi = async (data: FoodCategoryPayload) => {
  const res = await apiClient.post("/api/admin/food-categories", data);
  return res.data.data as FoodCategoryData;
};

export const updateAdminFoodCategoryApi = async (
  id: string,
  data: Partial<FoodCategoryPayload>
) => {
  const res = await apiClient.put(`/api/admin/food-categories/${id}`, data);
  return res.data.data as FoodCategoryData;
};

export const deleteAdminFoodCategoryApi = async (id: string) => {
  const res = await apiClient.delete(`/api/admin/food-categories/${id}`);
  return res.data;
};

export const getAdminStorageRulesApi = async () => {
  const res = await apiClient.get("/api/admin/storage-rules");
  return res.data.data as StorageRuleData[];
};

export const createAdminStorageRuleApi = async (data: StorageRulePayload) => {
  const res = await apiClient.post("/api/admin/storage-rules", data);
  return res.data.data as StorageRuleData;
};

export const updateAdminStorageRuleApi = async (
  id: string,
  data: Partial<StorageRulePayload>
) => {
  const res = await apiClient.put(`/api/admin/storage-rules/${id}`, data);
  return res.data.data as StorageRuleData;
};

export const deleteAdminStorageRuleApi = async (id: string) => {
  const res = await apiClient.delete(`/api/admin/storage-rules/${id}`);
  return res.data;
};

export const getAdminAiGeneratedDataApi = async () => {
  const res = await apiClient.get("/api/admin/ai-generated-data", {
    params: { status: "PENDING_REVIEW" },
  });
  return res.data.data as AiGeneratedData[];
};

export const reviewAdminAiGeneratedDataApi = async (
  id: string,
  data: { action: "APPROVE" | "REJECT"; reviewNote?: string }
) => {
  const res = await apiClient.patch(`/api/admin/ai-generated-data/${id}/review`, data);
  return res.data.data;
};
