import { InventoryFood, MealPlanMeal, Recipe, RecipeAvailability } from "../types/planner";

export function toDateInput(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function getErrorMessage(error: any) {
  return error?.response?.data?.message || error?.message || "Da co loi xay ra";
}

export function normalizeMealForApi(meal: MealPlanMeal): MealPlanMeal {
  const recipeId =
    typeof meal.recipeId === "string" ? meal.recipeId : meal.recipeId?._id;

  return {
    ...meal,
    recipeId,
  };
}

export function getCategoryName(value?: string | { _id: string; categoryName: string }) {
  return typeof value === "string" ? "" : value?.categoryName || "";
}

export function getDaysUntilExpiry(expiryDate: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);
  return Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function normalizeName(value?: string) {
  return String(value || "").trim().toLowerCase();
}

function matchesFoodName(ingredientName: string, foodName: string) {
  const ingredient = normalizeName(ingredientName);
  const food = normalizeName(foodName);
  return Boolean(ingredient && food && (ingredient.includes(food) || food.includes(ingredient)));
}

export function getRecipeAvailability(recipe: Recipe, foods: InventoryFood[]): RecipeAvailability {
  const requiredIngredients = (recipe.ingredients || []).filter(
    (ingredient) => ingredient.isRequired !== false
  );

  if (requiredIngredients.length === 0) {
    return {
      canSchedule: true,
      matchedIngredients: [],
      missingIngredients: [],
    };
  }

  const availableFoods = foods.filter((food) => food.status !== "EXPIRED");
  const matchedIngredients: string[] = [];
  const missingIngredients: string[] = [];

  requiredIngredients.forEach((ingredient) => {
    const matchedFood = availableFoods.find((food) => {
      if (!matchesFoodName(ingredient.ingredientName, food.foodName)) return false;
      const requiredQty = Number(ingredient.quantity) || 0;
      const availableQty = Number(food.quantity) || 0;
      return requiredQty <= 0 || availableQty >= requiredQty;
    });

    if (matchedFood) {
      matchedIngredients.push(ingredient.ingredientName);
    } else {
      missingIngredients.push(ingredient.ingredientName);
    }
  });

  return {
    canSchedule: missingIngredients.length === 0,
    matchedIngredients,
    missingIngredients,
  };
}

export function getRecipeUsedFoodIds(recipe: Recipe, foods: InventoryFood[]) {
  const availableFoods = foods.filter((food) => food.status !== "EXPIRED");
  const ids = new Set<string>();

  (recipe.ingredients || []).forEach((ingredient) => {
    const matchedFood = availableFoods.find((food) => {
      if (!matchesFoodName(ingredient.ingredientName, food.foodName)) return false;
      const requiredQty = Number(ingredient.quantity) || 0;
      const availableQty = Number(food.quantity) || 0;
      return requiredQty <= 0 || availableQty >= requiredQty;
    });
    if (matchedFood?._id) ids.add(matchedFood._id);
  });

  return Array.from(ids);
}
