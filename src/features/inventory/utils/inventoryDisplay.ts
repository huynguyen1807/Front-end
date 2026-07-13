import { COLORS } from "../../../constants/colors";
import { FoodCategory, FoodItem, FoodStatus } from "../types/inventory";

type SaveAlert = {
  title: string;
  message: string;
};

export const FOOD_STATUS_CONFIG: Record<FoodStatus, { color: string; label: string; icon: string }> = {
  SAFE: { color: COLORS.primary, label: "Còn tốt", icon: "check-circle" },
  NEAR_EXPIRY: { color: "#F59E0B", label: "Sắp hết hạn", icon: "warning" },
  EXPIRED: { color: COLORS.tertiary, label: "Hết hạn", icon: "error" },
  NEED_CHECK: { color: COLORS.onSurfaceVariant, label: "Cần kiểm tra", icon: "help" },
};

export function getCategoryDisplayName(category?: FoodCategory | string | null) {
  if (!category) return "Chưa phân loại";
  if (typeof category === "string") return category.trim() || "Chưa phân loại";
  return category.displayName?.trim() || category.categoryName?.trim() || "Chưa phân loại";
}

export function sortFoodCategories(categories: FoodCategory[]) {
  return [...categories].sort((a, b) => {
    const orderA = a.sortOrder ?? 0;
    const orderB = b.sortOrder ?? 0;
    if (orderA !== orderB) return orderA - orderB;
    return getCategoryDisplayName(a).localeCompare(getCategoryDisplayName(b), "vi");
  });
}

export function getDaysLeft(expiryDate: string): number {
  const diff = new Date(expiryDate).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function getInventoryUrgencyLabel(item: FoodItem) {
  const daysLeft = getDaysLeft(item.expiryDate);
  if (item.status === "EXPIRED" || daysLeft <= 0) return "Cần xử lý ngay!";
  if (item.status === "NEED_CHECK") return "Cần kiểm tra!";
  if (daysLeft <= 1) return "Cần dùng ngay!";
  return null;
}

export function getFoodSaveAlert(item: FoodItem): SaveAlert | null {
  if (item.status === "EXPIRED") {
    return {
      title: "Cần xử lý ngay",
      message: `"${item.foodName}" đã hết hạn. Vui lòng kiểm tra và xử lý thực phẩm này để đảm bảo an toàn.`,
    };
  }

  if (item.categoryWarning) {
    return {
      title: "Cần kiểm tra danh mục",
      message: item.categoryWarning,
    };
  }

  if (item.status === "NEED_CHECK") {
    return {
      title: "Cần kiểm tra",
      message: `"${item.foodName}" cần được kiểm tra lại danh mục hoặc cách bảo quản trước khi sử dụng.`,
    };
  }

  return null;
}
