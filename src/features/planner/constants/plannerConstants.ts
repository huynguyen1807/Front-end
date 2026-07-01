import { MealStatus, MealType, StorageRuleType } from "../types/planner";

export type Workspace = "meal" | "admin";
export type AdminSection = "category" | "storage" | "nutrition" | "recipe" | "review";
export type PlannerDetailTab = "inventory" | "schedule" | "macro" | "calories" | "video";

export type RecipeFormState = {
  id?: string;
  recipeName: string;
  description: string;
  imageUrl: string;
  cookingTime: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
  tags: string;
  ingredientName: string;
  ingredientQuantity: string;
  ingredientUnit: string;
};

export type NutritionFactFormState = {
  id?: string;
  foodName: string;
  categoryName: string;
  caloriesPerUnit: string;
  unit: "g" | "ml" | "item" | "serving";
  protein: string;
  carbs: string;
  fat: string;
};

export type CategoryFormState = {
  id?: string;
  categoryName: string;
  description: string;
};

export type StorageRuleFormState = {
  id?: string;
  categoryName: string;
  storageType: StorageRuleType;
  estimatedDays: string;
  instruction: string;
  warningMessage: string;
  priority: string;
};

export const emptyRecipeForm: RecipeFormState = {
  recipeName: "",
  description: "",
  imageUrl: "",
  cookingTime: "",
  difficulty: "EASY",
  calories: "",
  protein: "",
  carbs: "",
  fat: "",
  tags: "",
  ingredientName: "",
  ingredientQuantity: "",
  ingredientUnit: "g",
};

export const emptyFactForm: NutritionFactFormState = {
  foodName: "",
  categoryName: "",
  caloriesPerUnit: "",
  unit: "g",
  protein: "",
  carbs: "",
  fat: "",
};

export const emptyCategoryForm: CategoryFormState = {
  categoryName: "",
  description: "",
};

export const emptyStorageRuleForm: StorageRuleFormState = {
  categoryName: "",
  storageType: "REFRIGERATOR",
  estimatedDays: "",
  instruction: "",
  warningMessage: "",
  priority: "0",
};

export const mealTypeOptions: Array<{ key: MealType; label: string; time: string }> = [
  { key: "BREAKFAST", label: "Sáng", time: "08:00" },
  { key: "LUNCH", label: "Trưa", time: "12:30" },
  { key: "DINNER", label: "Tối", time: "19:00" },
  { key: "SNACK", label: "Phụ", time: "15:30" },
];

export const storageTypeOptions: Array<{ key: StorageRuleType; label: string }> = [
  { key: "REFRIGERATOR", label: "Tủ lạnh" },
  { key: "FREEZER", label: "Ngăn đông" },
  { key: "PANTRY", label: "Tủ khô" },
  { key: "KITCHEN_CABINET", label: "Tủ bếp" },
  { key: "OUTSIDE", label: "Ngoài trời" },
];

export const nextStatus: Record<MealStatus, MealStatus> = {
  PENDING: "PREPARING",
  PREPARING: "COMPLETED",
  COMPLETED: "PENDING",
};
