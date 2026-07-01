import { MealPlanMeal } from "../types/planner";

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
