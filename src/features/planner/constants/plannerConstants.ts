import { MealStatus, MealType, StorageRuleType } from "../types/planner";

export type Workspace = "meal" | "admin";
export type AdminSection = "category" | "storage" | "nutrition" | "recipe" | "review";
export type PlannerDetailTab = "inventory" | "schedule" | "macro" | "bmi" | "recipes" | "video";
export type CalorieGoalKey =
  | "UNDER_100"
  | "RANGE_100_500"
  | "RANGE_500_1000"
  | "RANGE_1000_1500"
  | "RANGE_1500_2000"
  | "OVER_2000";

export type BmiGender = "MALE" | "FEMALE" | "OTHER";
export type BmiActivityLevel = "LOW" | "MODERATE" | "HIGH";
export type BmiGoal = "MAINTAIN" | "WEIGHT_LOSS" | "MUSCLE_GAIN" | "HEALTHY_EATING";

export type RecipeIngredientFormState = {
  id: string;
  ingredientName: string;
  quantity: string;
  unit: string;
  isRequired: boolean;
};

export type RecipeFormState = {
  id?: string;
  recipeName: string;
  description: string;
  imageUrl: string;
  cookingSteps: string[];
  newCookingStep: string;
  cookingTime: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
  tags: string;
  ingredients: RecipeIngredientFormState[];
  ingredientName: string;
  ingredientQuantity: string;
  ingredientUnit: string;
};

export type BmiFormState = {
  weightKg: string;
  heightCm: string;
  age: string;
  gender: BmiGender;
  activityLevel: BmiActivityLevel;
  goal: BmiGoal;
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

export const createEmptyRecipeIngredient = (): RecipeIngredientFormState => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
  ingredientName: "",
  quantity: "",
  unit: "g",
  isRequired: true,
});

export const createEmptyRecipeForm = (): RecipeFormState => ({
  recipeName: "",
  description: "",
  imageUrl: "",
  cookingSteps: [],
  newCookingStep: "",
  cookingTime: "",
  difficulty: "EASY",
  calories: "",
  protein: "",
  carbs: "",
  fat: "",
  tags: "",
  ingredients: [createEmptyRecipeIngredient()],
  ingredientName: "",
  ingredientQuantity: "",
  ingredientUnit: "g",
});

export const emptyRecipeForm: RecipeFormState = createEmptyRecipeForm();

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

export const emptyBmiForm: BmiFormState = {
  weightKg: "",
  heightCm: "",
  age: "",
  gender: "OTHER",
  activityLevel: "MODERATE",
  goal: "HEALTHY_EATING",
};

export const bmiGenderOptions: Array<{ key: BmiGender; label: string }> = [
  { key: "OTHER", label: "Khác" },
  { key: "MALE", label: "Nam" },
  { key: "FEMALE", label: "Nữ" },
];

export const bmiActivityOptions: Array<{ key: BmiActivityLevel; label: string }> = [
  { key: "LOW", label: "Ít vận động" },
  { key: "MODERATE", label: "Vừa phải" },
  { key: "HIGH", label: "Vận động cao" },
];

export const bmiGoalOptions: Array<{ key: BmiGoal; label: string }> = [
  { key: "HEALTHY_EATING", label: "Ăn khỏe" },
  { key: "MAINTAIN", label: "Duy trì" },
  { key: "WEIGHT_LOSS", label: "Giảm cân" },
  { key: "MUSCLE_GAIN", label: "Tăng cơ" },
];

export const calorieGoalOptions: Array<{
  key: CalorieGoalKey;
  label: string;
  min: number;
  max?: number;
  target: number;
}> = [
  { key: "UNDER_100", label: "Dưới 100", min: 0, max: 100, target: 80 },
  { key: "RANGE_100_500", label: "100-500", min: 100, max: 500, target: 300 },
  { key: "RANGE_500_1000", label: "500-1000", min: 500, max: 1000, target: 750 },
  { key: "RANGE_1000_1500", label: "1000-1500", min: 1000, max: 1500, target: 1250 },
  { key: "RANGE_1500_2000", label: "1500-2000", min: 1500, max: 2000, target: 1750 },
  { key: "OVER_2000", label: "Trên 2000", min: 2000, target: 2300 },
];

export const mealTypeOptions: Array<{ key: MealType; label: string; time: string }> = [
  { key: "BREAKFAST", label: "Sáng", time: "07:30" },
  { key: "LUNCH", label: "Trưa", time: "12:00" },
  { key: "AFTERNOON", label: "Chiều", time: "15:30" },
  { key: "DINNER", label: "Tối", time: "18:30" },
  { key: "LATE_NIGHT", label: "Khuya", time: "21:30" },
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
