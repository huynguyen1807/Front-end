import { formatFoodAmount } from './foodUnits';

type MacroSummary = {
  protein: number;
  carbs: number;
  fat: number;
};

type FoodWithNutrition = {
  calories?: number;
  macroSummary?: MacroSummary;
  nutrition?: {
    calories: number;
    macroSummary: MacroSummary;
    matched?: boolean;
  };
  nutritionDisplay?: {
    calories: number;
    macroSummary: MacroSummary;
    basisQuantity: number;
    basisUnit: string;
    isTotalInventory: boolean;
    matched: boolean;
    source?: string;
    estimated?: boolean;
  };
};

const emptyMacro: MacroSummary = { protein: 0, carbs: 0, fat: 0 };

export function getFoodDisplayNutrition(food: FoodWithNutrition) {
  return food.nutritionDisplay || {
    calories: food.nutrition?.calories ?? food.calories ?? 0,
    macroSummary: food.nutrition?.macroSummary ?? food.macroSummary ?? emptyMacro,
    basisQuantity: 0,
    basisUnit: '',
    isTotalInventory: true,
    matched: food.nutrition?.matched ?? false,
    source: undefined,
    estimated: true,
  };
}

export function formatNutritionBasis(
  nutrition: ReturnType<typeof getFoodDisplayNutrition>,
) {
  if (!nutrition.basisQuantity || !nutrition.basisUnit) return 'theo số lượng hiện có';
  return `trên ${formatFoodAmount(nutrition.basisQuantity, nutrition.basisUnit)}`;
}
