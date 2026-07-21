import React from "react";
import { TextInput, View } from "react-native";

import AdminActionRow from "../../adminData/components/shared/AdminActionRow";
import AdminChipButton from "../../adminData/components/shared/AdminChipButton";
import AdminDataRow from "../../adminData/components/shared/AdminDataRow";
import AdminField from "../../adminData/components/shared/AdminField";
import AdminSection from "../../adminData/components/shared/AdminSection";
import { adminDataStyles as styles } from "../../adminData/styles/AdminData.styles";
import {
  NutritionFactFormState,
  emptyFactForm,
} from "../../planner/constants/plannerConstants";
import { NutritionFact } from "../../planner/types/planner";
import { getCategoryName } from "../../planner/utils/plannerUtils";

type NutritionAdminPanelProps = {
  nutritionFacts: NutritionFact[];
  factForm: NutritionFactFormState;
  setFactForm: React.Dispatch<React.SetStateAction<NutritionFactFormState>>;
  saving: boolean;
  onSaveNutritionFact: () => void;
  onDeleteNutritionFact: (fact: NutritionFact) => void;
};

const unitOptions = ["g", "kg", "ml", "l", "quả", "cái"] as const;

export default function NutritionAdminPanel({
  nutritionFacts,
  factForm,
  setFactForm,
  saving,
  onSaveNutritionFact,
  onDeleteNutritionFact,
}: NutritionAdminPanelProps) {
  return (
    <AdminSection
      title="Update Nutrition Data"
      subtitle="Cập nhật calories, protein, carbs và fat để hệ thống tính meal chính xác."
    >
      <AdminField label="Food name">
        <TextInput
          style={styles.input}
          value={factForm.foodName}
          onChangeText={(value) => setFactForm((form) => ({ ...form, foodName: value }))}
          placeholder="Chicken breast"
        />
      </AdminField>
      <AdminField label="Tên tương đương">
        <TextInput
          style={styles.input}
          value={factForm.aliases}
          onChangeText={(value) => setFactForm((form) => ({ ...form, aliases: value }))}
          placeholder="Táo, Táo đỏ, Red apple"
        />
      </AdminField>
      <View style={styles.formGrid}>
        <AdminField label="Category">
          <TextInput
            style={styles.input}
            value={factForm.categoryName}
            onChangeText={(value) =>
              setFactForm((form) => ({ ...form, categoryName: value }))
            }
            placeholder="Meat"
          />
        </AdminField>
        <AdminField label="Khẩu phần chuẩn">
          <TextInput
            style={styles.input}
            value={factForm.baseQuantity}
            keyboardType="numeric"
            onChangeText={(value) =>
              setFactForm((form) => ({ ...form, baseQuantity: value }))
            }
            placeholder="100"
          />
        </AdminField>
        <AdminField label="Calories / unit">
          <TextInput
            style={styles.input}
            value={factForm.caloriesPerUnit}
            keyboardType="numeric"
            onChangeText={(value) =>
              setFactForm((form) => ({ ...form, caloriesPerUnit: value }))
            }
            placeholder="1.65"
          />
        </AdminField>
      </View>
      <AdminField label="Unit">
        <View style={styles.segmentRow}>
          {unitOptions.map((unit) => (
            <AdminChipButton
              key={unit}
              label={unit}
              active={factForm.unit === unit}
              onPress={() => setFactForm((form) => ({ ...form, unit }))}
            />
          ))}
        </View>
      </AdminField>
      <View style={styles.formGrid}>
        <AdminField label="Protein">
          <TextInput
            style={styles.input}
            value={factForm.protein}
            keyboardType="numeric"
            onChangeText={(value) => setFactForm((form) => ({ ...form, protein: value }))}
          />
        </AdminField>
        <AdminField label="Carbs">
          <TextInput
            style={styles.input}
            value={factForm.carbs}
            keyboardType="numeric"
            onChangeText={(value) => setFactForm((form) => ({ ...form, carbs: value }))}
          />
        </AdminField>
        <AdminField label="Fat">
          <TextInput
            style={styles.input}
            value={factForm.fat}
            keyboardType="numeric"
            onChangeText={(value) => setFactForm((form) => ({ ...form, fat: value }))}
          />
        </AdminField>
      </View>
      <AdminActionRow
        primaryLabel={factForm.id ? "Update nutrition" : "Create nutrition"}
        primaryIcon="database-plus-outline"
        onPrimary={onSaveNutritionFact}
        disabled={saving}
        onCancel={factForm.id ? () => setFactForm(emptyFactForm) : undefined}
      />
      {nutritionFacts.slice(0, 12).map((fact) => (
        <AdminDataRow
          key={fact._id}
          title={fact.foodName}
          subtitle={`${fact.caloriesPerUnit} kcal/${fact.baseQuantity || 100}${fact.unit} - P ${fact.protein}g - C ${fact.carbs}g - F ${fact.fat}g`}
          onEdit={() =>
            setFactForm({
              id: fact._id,
              foodName: fact.foodName,
              aliases: (fact.aliases || []).join(", "),
              categoryName: getCategoryName(fact.categoryId),
              caloriesPerUnit: String(fact.caloriesPerUnit),
              baseQuantity: String(fact.baseQuantity || 100),
              unit: fact.unit,
              protein: String(fact.protein || 0),
              carbs: String(fact.carbs || 0),
              fat: String(fact.fat || 0),
            })
          }
          onDelete={() => onDeleteNutritionFact(fact)}
        />
      ))}
    </AdminSection>
  );
}
