import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Text, View } from "react-native";

import { COLORS } from "../../../constants/colors";
import {
  CalorieGoalKey,
  calorieGoalOptions,
  mealTypeOptions,
} from "../constants/plannerConstants";
import { GeneratedMealPlanResult, MealType } from "../types/planner";
import { plannerStyles as styles } from "../styles/PlannerScreen.styles";
import ActionButton from "./shared/ActionButton";
import ChipButton from "./shared/ChipButton";
import Field from "./shared/Field";
import Section from "./shared/Section";

type DailyPlanGeneratorProps = {
  selectedCalorieGoal: CalorieGoalKey;
  selectedMealTypes: MealType[];
  generatedResult: GeneratedMealPlanResult | null;
  saving: boolean;
  onSelectCalorieGoal: (value: CalorieGoalKey) => void;
  onToggleMealType: (mealType: MealType) => void;
  onGenerate: () => void;
};

export default function DailyPlanGenerator({
  selectedCalorieGoal,
  selectedMealTypes,
  generatedResult,
  saving,
  onSelectCalorieGoal,
  onToggleMealType,
  onGenerate,
}: DailyPlanGeneratorProps) {
  return (
    <Section
      title="Generate Daily Meal Plan"
      subtitle="AI tạo recipe gợi ý từ inventory theo mức calories đã chọn, ưu tiên đồ sắp hết hạn và sở thích."
    >
      <Field label="Calories option">
        <View style={styles.segmentRow}>
          {calorieGoalOptions.map((option) => (
            <ChipButton
              key={option.key}
              label={option.label}
              active={selectedCalorieGoal === option.key}
              onPress={() => onSelectCalorieGoal(option.key)}
            />
          ))}
        </View>
      </Field>
      <Field label="Meal slots">
        <View style={styles.segmentRow}>
          {mealTypeOptions.map((option) => (
            <ChipButton
              key={option.key}
              label={option.label}
              active={selectedMealTypes.includes(option.key)}
              onPress={() => onToggleMealType(option.key)}
            />
          ))}
        </View>
      </Field>
      <View style={styles.actionRow}>
        <ActionButton
          label="Generate recipes"
          icon="star-four-points-outline"
          disabled={saving}
          onPress={onGenerate}
        />
      </View>
      {generatedResult && (
        <View style={styles.inlineNotice}>
          <MaterialCommunityIcons name="check-decagram-outline" size={18} color={COLORS.primary} />
          <Text style={styles.inlineNoticeText}>
            Đã chuẩn bị {generatedResult.generatedRecipes?.length || generatedResult.recommendations.length} recipe gợi ý từ {generatedResult.inventoryPriority.length} thực phẩm trong tủ. Chọn recipe phù hợp ở Recommended Recipes để đưa vào lịch.
          </Text>
        </View>
      )}
      {generatedResult?.mealCalorieAllocations?.length ? (
        <View style={styles.metricGrid}>
          {generatedResult.mealCalorieAllocations.map((allocation) => {
            const mealLabel =
              mealTypeOptions.find((option) => option.key === allocation.mealType)?.label ||
              allocation.mealType;
            const maxText = Number.isFinite(allocation.max)
              ? `${Math.round(allocation.max || 0)}`
              : "+";

            return (
              <View key={allocation.mealType} style={styles.metric}>
                <Text style={styles.metricValue}>{Math.round(allocation.target)} kcal</Text>
                <Text style={styles.metricLabel}>
                  {mealLabel}: {Math.round(allocation.min)}-{maxText}
                </Text>
              </View>
            );
          })}
        </View>
      ) : null}
    </Section>
  );
}
