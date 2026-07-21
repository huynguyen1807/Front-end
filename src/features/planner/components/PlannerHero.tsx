import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Text, View } from "react-native";

import { InventoryFood, MacroSummary, MealPlan } from "../types/planner";
import { Workspace } from "../constants/plannerConstants";
import { getDaysUntilExpiry } from "../utils/plannerUtils";
import { plannerStyles as styles } from "../styles/PlannerScreen.styles";
import { COLORS } from "../../../constants/colors";
import ChipButton from "./shared/ChipButton";

type PlannerHeroProps = {
  isAdmin: boolean;
  workspace: Workspace;
  onChangeWorkspace: (workspace: Workspace) => void;
  foods: InventoryFood[];
  plans: MealPlan[];
  recipeCount: number;
  nutrition: { calories: number; macroSummary: MacroSummary };
  aiReviewCount: number;
};

export default function PlannerHero({
  isAdmin,
  workspace,
  onChangeWorkspace,
  foods,
  plans,
  recipeCount,
  nutrition,
  aiReviewCount,
}: PlannerHeroProps) {
  const nearExpiryCount = foods.filter(
    (food) => food.status === "NEAR_EXPIRY" || getDaysUntilExpiry(food.expiryDate) <= 3
  ).length;
  const mealCount = plans.reduce((sum, plan) => sum + plan.meals.length, 0);

  return (
    <View style={styles.hero}>
      <View style={styles.heroHeader}>
        <View>
          <Text style={styles.eyebrow}>Bữa ăn + Công thức + Dinh dưỡng</Text>
          <Text style={styles.heroTitle}>Smart Meal Workspace</Text>
        </View>
        <MaterialCommunityIcons name="silverware-fork-knife" size={30} color={COLORS.primary} />
      </View>
      <View style={styles.heroStats}>
        <MiniStat label="Thực phẩm" value={String(foods.length)} />
        <MiniStat label="Công thức" value={String(recipeCount)} />
        <MiniStat label="Bữa ăn" value={String(mealCount)} />
        <MiniStat label="Kcal hôm nay" value={String(Math.round(nutrition.calories))} />
        <MiniStat label="Protein" value={`${Math.round(nutrition.macroSummary.protein)}g`} />
        <MiniStat label="Carbs" value={`${Math.round(nutrition.macroSummary.carbs)}g`} />
        <MiniStat label="Fat" value={`${Math.round(nutrition.macroSummary.fat)}g`} />
        {nearExpiryCount > 0 && <MiniStat label="Sắp hết hạn" value={String(nearExpiryCount)} />}
        {isAdmin && <MiniStat label="AI cần duyệt" value={String(aiReviewCount)} />}
      </View>
      {isAdmin && (
        <View style={styles.workspaceSwitch}>
          <ChipButton label="Meal Planner" active={workspace === "meal"} onPress={() => onChangeWorkspace("meal")} />
          <ChipButton label="Admin Data" active={workspace === "admin"} onPress={() => onChangeWorkspace("admin")} />
        </View>
      )}
    </View>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.miniStat}>
      <Text style={styles.miniStatValue}>{value}</Text>
      <Text style={styles.miniStatLabel}>{label}</Text>
    </View>
  );
}
