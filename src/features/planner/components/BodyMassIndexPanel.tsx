import { Dispatch, SetStateAction } from "react";
import { Text, TextInput, View } from "react-native";

import {
  BmiFormState,
  bmiActivityOptions,
  bmiGenderOptions,
  bmiGoalOptions,
} from "../constants/plannerConstants";
import { BmiProfile } from "../types/planner";
import { getBmiSuggestion } from "../utils/bmiUtils";
import { plannerStyles as styles } from "../styles/PlannerScreen.styles";
import ActionButton from "./shared/ActionButton";
import ChipButton from "./shared/ChipButton";
import Field from "./shared/Field";
import MetricGrid from "./shared/MetricGrid";
import Section from "./shared/Section";

type BodyMassIndexPanelProps = {
  form: BmiFormState;
  profile: BmiProfile | null;
  saving: boolean;
  onChangeForm: Dispatch<SetStateAction<BmiFormState>>;
  onSave: () => void;
  onClear: () => void;
};

export default function BodyMassIndexPanel({
  form,
  profile,
  saving,
  onChangeForm,
  onSave,
  onClear,
}: BodyMassIndexPanelProps) {
  return (
    <Section
      title="Chỉ số BMI"
      subtitle="BMI giúp AI hiểu thể trạng cơ bản để gợi ý món ăn phù hợp hơn. Nếu bỏ trống, AI sẽ dùng chuẩn người khỏe mạnh."
    >
      <View style={styles.formGrid}>
        <Field label="Cân nặng (kg)">
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={form.weightKg}
            onChangeText={(value) => onChangeForm((current) => ({ ...current, weightKg: value }))}
            placeholder="Ví dụ: 60"
          />
        </Field>
        <Field label="Chiều cao (cm)">
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={form.heightCm}
            onChangeText={(value) => onChangeForm((current) => ({ ...current, heightCm: value }))}
            placeholder="Ví dụ: 170"
          />
        </Field>
        <Field label="Tuổi">
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={form.age}
            onChangeText={(value) => onChangeForm((current) => ({ ...current, age: value }))}
            placeholder="Không bắt buộc"
          />
        </Field>
      </View>

      <Field label="Giới tính">
        <View style={styles.segmentRow}>
          {bmiGenderOptions.map((item) => (
            <ChipButton
              key={item.key}
              label={item.label}
              active={form.gender === item.key}
              onPress={() => onChangeForm((current) => ({ ...current, gender: item.key }))}
            />
          ))}
        </View>
      </Field>

      <Field label="Mức vận động">
        <View style={styles.segmentRow}>
          {bmiActivityOptions.map((item) => (
            <ChipButton
              key={item.key}
              label={item.label}
              active={form.activityLevel === item.key}
              onPress={() =>
                onChangeForm((current) => ({ ...current, activityLevel: item.key }))
              }
            />
          ))}
        </View>
      </Field>

      <Field label="Mục tiêu">
        <View style={styles.segmentRow}>
          {bmiGoalOptions.map((item) => (
            <ChipButton
              key={item.key}
              label={item.label}
              active={form.goal === item.key}
              onPress={() => onChangeForm((current) => ({ ...current, goal: item.key }))}
            />
          ))}
        </View>
      </Field>

      <View style={styles.actionRow}>
        <ActionButton
          label="Lưu BMI"
          icon="content-save-outline"
          disabled={saving}
          onPress={onSave}
        />
        <ActionButton
          label="Xóa BMI"
          icon="close"
          secondary
          disabled={saving}
          onPress={onClear}
        />
      </View>

      {profile ? (
        <MetricGrid
          metrics={[
            { label: "BMI", value: `${profile.bmi}` },
            { label: "Phân loại", value: profile.categoryLabel },
            { label: "Cân nặng", value: `${profile.weightKg} kg` },
            { label: "Chiều cao", value: `${profile.heightCm} cm` },
          ]}
        />
      ) : null}

      <Text style={styles.hint}>{getBmiSuggestion(profile)}</Text>
    </Section>
  );
}
