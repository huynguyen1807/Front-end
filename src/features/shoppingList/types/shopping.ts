export interface ChecklistItem {
  id: string;
  name: string;
  subtext: string;
  checked: boolean;
  category: "vegetables" | "meat" | "spices";
}

export type ShoppingReason =
  | "MISSING_INGREDIENT"
  | "USER_ADDED"
  | "LOW_STOCK"
  | "VIDEO_RECIPE";

export type ShoppingCategoryRef =
  | string
  | {
      _id: string;
      categoryName?: string;
    };

export interface ShoppingListItem {
  _id: string;
  foodName: string;
  categoryId?: ShoppingCategoryRef;
  quantity: number;
  unit: string;
  reason?: ShoppingReason;
  isPurchased: boolean;
}

export interface ShoppingList {
  _id: string;
  listName: string;
  status: "ACTIVE" | "COMPLETED" | "ARCHIVED";
  items: ShoppingListItem[];
  updatedAt?: string;
}
