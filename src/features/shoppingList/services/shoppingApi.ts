import { apiClient } from "../../../services/apiClient";
import {
  AddShoppingListItemPayload,
  CreateShoppingListPayload,
  ShoppingList,
  ShoppingListItem,
  ShoppingListStatus,
  ShoppingOwnerType,
  UpdateShoppingListItemPayload,
} from "../types/shopping";

export const getShoppingListsApi = async (
  status: ShoppingListStatus | "ALL" = "ACTIVE",
  options?: { signal?: AbortSignal; timeout?: number; context?: { ownerType: ShoppingOwnerType; householdId?: string } }
): Promise<ShoppingList[]> => {
  const { context, ...requestOptions } = options ?? {};
  const res = await apiClient.get("/api/shopping-lists", { ...requestOptions, params: { status, ...context } });
  return res.data.data;
};

export const createShoppingListApi = async (
  data: CreateShoppingListPayload
): Promise<ShoppingList> => {
  const res = await apiClient.post("/api/shopping-lists", data);
  return res.data.data;
};

export const getShoppingListByIdApi = async (id: string, options?: { signal?: AbortSignal; timeout?: number }): Promise<ShoppingList> => {
  const res = options ? await apiClient.get(`/api/shopping-lists/${id}`, options) : await apiClient.get(`/api/shopping-lists/${id}`);
  return res.data.data;
};

export const addShoppingListItemApi = async (
  listId: string,
  data: AddShoppingListItemPayload
): Promise<ShoppingListItem> => {
  const res = await apiClient.post(`/api/shopping-lists/${listId}/items`, data);
  return res.data.data;
};

export const updateShoppingListItemApi = async (
  listId: string,
  itemId: string,
  data: UpdateShoppingListItemPayload
): Promise<ShoppingListItem> => {
  const res = await apiClient.patch(`/api/shopping-lists/${listId}/items/${itemId}`, data);
  return res.data.data;
};

export const deleteShoppingListItemApi = async (listId: string, itemId: string) => {
  const res = await apiClient.delete(`/api/shopping-lists/${listId}/items/${itemId}`);
  return res.data;
};

export const completeShoppingListApi = async (listId: string): Promise<ShoppingList> => {
  const res = await apiClient.patch(`/api/shopping-lists/${listId}/complete`);
  return res.data.data;
};
