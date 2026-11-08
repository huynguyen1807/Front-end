import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Text, View } from "react-native";

import { InventoryFood, MealPlan } from "../types/planner";
import { Workspace } from "../constants/plannerConstants";
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
  aiReviewCount: number;
};

export default function PlannerHero({
  isAdmin,
  workspace,
  onChangeWorkspace,
  foods,
  plans,
  recipeCount,
  aiReviewCount,
}: PlannerHeroProps) {
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
