import {
  InventoryFood,
  MealPlanMeal,
  MacroSummary,
  Recipe,
  RecipeAvailability,
  UsedFoodUsage,
} from "../types/planner";

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
  const usedFoods = (meal.usedFoods || [])
    .map((usage) => ({
      ...usage,
      foodItemId:
        typeof usage.foodItemId === "string" ? usage.foodItemId : usage.foodItemId?._id,
    }))
    .filter((usage) => usage.foodItemId && Number(usage.quantityUsed) > 0);

  return {
    ...meal,
    recipeId,
    usedFoods,
    usedFoodItemIds: usedFoods.length
      ? usedFoods.map((usage) => usage.foodItemId as string)
      : meal.usedFoodItemIds,
  };
}

export function getCategoryName(value?: string | { _id: string; categoryName: string } | null) {
  return value && typeof value === "object" ? value.categoryName || "" : "";
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

function normalizeUnit(value?: string) {
  const unit = normalizeName(value);
  const normalizedText = unit
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d");
  if (["kg", "kilogram", "kilograms"].includes(unit)) return "kg";
  if (["g", "gram", "grams"].includes(unit)) return "g";
  if (["l", "liter", "litre", "liters", "litres"].includes(unit)) return "l";
  if (["ml", "milliliter", "millilitre", "milliliters", "millilitres"].includes(unit)) {
    return "ml";
  }
  if (["item", "piece", "pieces", "cai", "qua", "trai"].includes(normalizedText)) {
    return "item";
  }
  if (["serving", "portion", "phan"].includes(normalizedText)) return "serving";
  return unit;
}

function getUnitFamily(unit?: string) {
  const normalized = normalizeUnit(unit);
  if (normalized === "kg" || normalized === "g") return "mass";
  if (normalized === "l" || normalized === "ml") return "volume";
  if (normalized === "item") return "count";
  if (normalized === "serving") return "serving";
  return normalized || "unknown";
}

function convertQuantity(quantity: number, fromUnit?: string, toUnit?: string) {
  const from = normalizeUnit(fromUnit);
  const to = normalizeUnit(toUnit);
  const value = Number(quantity) || 0;
  if (!from || !to || from === to) return value;
  if (getUnitFamily(from) !== getUnitFamily(to)) return null;
  if (from === "kg" && to === "g") return value * 1000;
  if (from === "g" && to === "kg") return value / 1000;
  if (from === "l" && to === "ml") return value * 1000;
  if (from === "ml" && to === "l") return value / 1000;
  return value;
}

function roundOne(value: number) {
  return Math.round((Number(value) || 0) * 10) / 10;
}

function getFoodCalories(food: InventoryFood) {
  return Number(food.calories ?? food.nutrition?.calories) || 0;
}

function getFoodMacroSummary(food: InventoryFood): MacroSummary {
  return {
    protein: Number(food.macroSummary?.protein ?? food.nutrition?.macroSummary.protein) || 0,
    carbs: Number(food.macroSummary?.carbs ?? food.nutrition?.macroSummary.carbs) || 0,
    fat: Number(food.macroSummary?.fat ?? food.nutrition?.macroSummary.fat) || 0,
  };
}

function findMatchingFood(ingredient: { ingredientName: string; quantity?: number; unit?: string }, foods: InventoryFood[]) {
  return foods.find((food) => {
    if (food.status === "EXPIRED") return false;
    if (!matchesFoodName(ingredient.ingredientName, food.foodName)) return false;
    const requiredQty = Number(ingredient.quantity) || 0;
    if (requiredQty <= 0) return Number(food.quantity) > 0;
    const requiredInFoodUnit = convertQuantity(requiredQty, ingredient.unit, food.unit);
    return requiredInFoodUnit !== null && Number(food.quantity) >= requiredInFoodUnit;
  });
}

export function buildUsedFoodUsage(
  food: InventoryFood,
  quantityUsed: number,
  unit = food.unit
): UsedFoodUsage | null {
  const quantity = Number(quantityUsed) || 0;
  if (quantity <= 0) return null;

  const quantityInFoodUnit = convertQuantity(quantity, unit, food.unit);
  if (quantityInFoodUnit === null || quantityInFoodUnit <= 0) return null;

  const availableQuantity = Number(food.quantity) || 0;
  const ratio = availableQuantity > 0 ? Math.min(quantityInFoodUnit / availableQuantity, 1) : 0;
  const macro = getFoodMacroSummary(food);

  return {
    foodItemId: food._id,
    foodName: food.foodName,
    quantityUsed: roundOne(quantity),
    unit: unit || food.unit,
    calories: roundOne(getFoodCalories(food) * ratio),
    macroSummary: {
      protein: roundOne(macro.protein * ratio),
      carbs: roundOne(macro.carbs * ratio),
      fat: roundOne(macro.fat * ratio),
    },
  };
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
    const matchedFood = findMatchingFood(ingredient, availableFoods);

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
  return Array.from(new Set(getRecipeUsedFoods(recipe, foods).map((usage) => usage.foodItemId as string)));
}

export function getRecipeUsedFoods(recipe: Recipe, foods: InventoryFood[]) {
  const availableFoods = foods.filter((food) => food.status !== "EXPIRED");
  const usages: UsedFoodUsage[] = [];
  const usedIds = new Set<string>();

  (recipe.ingredients || [])
    .filter((ingredient) => ingredient.isRequired !== false)
    .forEach((ingredient) => {
      const matchedFood = findMatchingFood(ingredient, availableFoods);
      if (!matchedFood?._id || usedIds.has(matchedFood._id)) return;

      const usage = buildUsedFoodUsage(
        matchedFood,
        Number(ingredient.quantity) || Number(matchedFood.quantity) || 1,
        ingredient.unit || matchedFood.unit
      );

      if (usage) {
        usages.push(usage);
        usedIds.add(matchedFood._id);
      }
    });

  return usages;
}
