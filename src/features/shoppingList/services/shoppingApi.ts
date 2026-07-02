import { apiClient } from "../../../services/apiClient";
import { ShoppingList } from "../types/shopping";

export const getShoppingListsApi = async (): Promise<ShoppingList[]> => {
  const res = await apiClient.get("/api/shopping-lists");
  return res.data.data;
};

export const updateShoppingListItemApi = async (
  listId: string,
  itemId: string,
  data: { isPurchased: boolean }
): Promise<ShoppingList> => {
  const res = await apiClient.patch(`/api/shopping-lists/${listId}/items/${itemId}`, data);
  return res.data.data;
};
