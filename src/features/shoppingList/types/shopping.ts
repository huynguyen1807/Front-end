export interface ChecklistItem {
  id: string;
  name: string;
  subtext: string;
  checked: boolean;
  category: "vegetables" | "meat" | "spices";
}

export type ShoppingOwnerType = "USER" | "HOUSEHOLD";
export type ShoppingVisibility = "PERSONAL" | "SHARED";
export type ShoppingListStatus = "ACTIVE" | "COMPLETED" | "ARCHIVED";
export type ShoppingItemReason =
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
  itemId?: string;
  foodName: string;
  categoryId?: ShoppingCategoryRef;
  quantity: number;
  unit: string;
  reason?: ShoppingItemReason;
  isPurchased: boolean;
  purchasedAt?: string;
  addedBy?: string;
  purchasedBy?: string;
}

export interface ShoppingList {
  _id: string;
  ownerType?: ShoppingOwnerType;
  userId?: string;
  householdId?:
    | string
    | {
        _id: string;
        householdName: string;
        planType: "FREE" | "PREMIUM";
        status: "ACTIVE" | "INACTIVE";
      };
  listName: string;
  visibility?: ShoppingVisibility;
  status: ShoppingListStatus;
  items: ShoppingListItem[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateShoppingListPayload {
  listName: string;
  ownerType?: ShoppingOwnerType;
  householdId?: string;
  visibility?: ShoppingVisibility;
}

export interface AddShoppingListItemPayload {
  foodName: string;
  quantity: number;
  unit: string;
  reason?: ShoppingItemReason;
}

export type UpdateShoppingListItemPayload = Partial<{
  foodName: string;
  quantity: number;
  unit: string;
  reason: ShoppingItemReason;
  isPurchased: boolean;
}>;
