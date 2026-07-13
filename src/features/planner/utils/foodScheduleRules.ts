import { InventoryFood } from "../types/planner";
import { getCategoryName } from "./plannerUtils";

const readyToEatPattern =
  /fruit|trái cây|hoa quả|cooked|đã nấu|ready|ăn liền|sữa|milk|yogurt|yaourt|phô mai|cheese|bread|bánh mì|chuối|banana|táo|apple|cam|orange|nho|grape|dâu|berry|xoài|mango|salad|rau|vegetable|xà lách|lettuce/i;

const rawIngredientPattern =
  /raw|sống|thịt|gà|bò|heo|lợn|cá|tôm|mực|hải sản|chicken|beef|pork|fish|shrimp|seafood|meat/i;

export function getFoodScheduleRule(food: InventoryFood) {
  const text = `${food.foodName} ${getCategoryName(food.categoryId)}`.toLowerCase();
  const isReadyToEat = readyToEatPattern.test(text);
  const isRawIngredient = rawIngredientPattern.test(text) && !/cooked|đã nấu|ăn liền|ready/i.test(text);
  const canScheduleDirectly =
    food.status !== "EXPIRED" && Number(food.quantity) > 0 && (isReadyToEat || !isRawIngredient);

  if (canScheduleDirectly) {
    return {
      canScheduleDirectly: true,
      actionLabel: "Lên lịch",
      reason: "",
    };
  }

  return {
    canScheduleDirectly: false,
    actionLabel: isRawIngredient ? "Cần chế biến" : "Không khả dụng",
    reason: isRawIngredient
      ? "Nguyên liệu sống nên được dùng để tạo công thức trước khi đưa vào lịch bữa ăn."
      : "Thực phẩm này chưa thể đưa trực tiếp vào lịch bữa ăn.",
  };
}
