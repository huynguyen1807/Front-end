import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Text, TextInput, View } from "react-native";

import { COLORS } from "../../../constants/colors";
import { GeneratedMealPlanResult, MealType } from "../types/planner";
import { mealTypeOptions } from "../constants/plannerConstants";
import { plannerStyles as styles } from "../styles/PlannerScreen.styles";
import ActionButton from "./shared/ActionButton";
import ChipButton from "./shared/ChipButton";
import Field from "./shared/Field";
import Section from "./shared/Section";

type DailyPlanGeneratorProps = {
  targetCalories: string;
  selectedMealTypes: MealType[];
  generatedResult: GeneratedMealPlanResult | null;
  saving: boolean;
  onChangeTargetCalories: (value: string) => void;
  onToggleMealType: (mealType: MealType) => void;
  onGenerate: () => void;
};

export default function DailyPlanGenerator({
  targetCalories,
  selectedMealTypes,
  generatedResult,
  saving,
  onChangeTargetCalories,
  onToggleMealType,
  onGenerate,
}: DailyPlanGeneratorProps) {
  return (
    <Section
      title="Generate Daily Meal Plan"
      subtitle="AI Recommendation Service ưu tiên đồ sắp hết hạn, mục tiêu calories và recipe chính thức."
    >
      <View style={styles.formGrid}>
        <Field label="Calorie goal">
          <TextInput
            style={styles.input}
            value={targetCalories}
            keyboardType="numeric"
            onChangeText={onChangeTargetCalories}
            placeholder="2000"
          />
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
      </View>
      <View style={styles.actionRow}>
        <ActionButton
          label="Generate plan"
          icon="star-four-points-outline"
          disabled={saving}
            onPress={onGenerate}
        />
      </View>
      {generatedResult && (
        <View style={styles.inlineNotice}>
          <MaterialCommunityIcons name="check-decagram-outline" size={18} color={COLORS.primary} />
          <Text style={styles.inlineNoticeText}>
            Đã tạo plan {Math.round(generatedResult.plan.totalCalories || 0)} kcal từ {generatedResult.inventoryPriority.length} món trong tủ.
          </Text>
        </View>
      )}
    </Section>
  );
}
