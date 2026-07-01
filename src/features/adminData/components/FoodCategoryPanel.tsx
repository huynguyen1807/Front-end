import React from "react";
import { TextInput } from "react-native";

import {
  CategoryFormState,
  emptyCategoryForm,
} from "../../planner/constants/plannerConstants";
import { FoodCategoryData } from "../../planner/types/planner";
import { adminDataStyles as styles } from "../styles/AdminData.styles";
import AdminActionRow from "./shared/AdminActionRow";
import AdminDataRow from "./shared/AdminDataRow";
import AdminField from "./shared/AdminField";
import AdminSection from "./shared/AdminSection";

type FoodCategoryPanelProps = {
  categories: FoodCategoryData[];
  categoryForm: CategoryFormState;
  setCategoryForm: React.Dispatch<React.SetStateAction<CategoryFormState>>;
  saving: boolean;
  onSaveCategory: () => void;
  onDeleteCategory: (category: FoodCategoryData) => void;
};

export default function FoodCategoryPanel({
  categories,
  categoryForm,
  setCategoryForm,
  saving,
  onSaveCategory,
  onDeleteCategory,
}: FoodCategoryPanelProps) {
  return (
    <AdminSection
      title="Create Food Category"
      subtitle="Quản lý nhóm thực phẩm để phân loại inventory, nutrition và storage rule."
    >
      <AdminField label="Tên category">
        <TextInput
          style={styles.input}
          value={categoryForm.categoryName}
          onChangeText={(value) =>
            setCategoryForm((form) => ({ ...form, categoryName: value }))
          }
          placeholder="Vegetables, Meat, Dairy..."
        />
      </AdminField>
      <AdminField label="Mô tả">
        <TextInput
          style={[styles.input, styles.textArea]}
          value={categoryForm.description}
          onChangeText={(value) =>
            setCategoryForm((form) => ({ ...form, description: value }))
          }
          multiline
          placeholder="Ghi chú phân loại"
        />
      </AdminField>
      <AdminActionRow
        primaryLabel={categoryForm.id ? "Update category" : "Create category"}
        primaryIcon="shape-plus-outline"
        onPrimary={onSaveCategory}
        disabled={saving}
        onCancel={categoryForm.id ? () => setCategoryForm(emptyCategoryForm) : undefined}
      />
      {categories.map((category) => (
        <AdminDataRow
          key={category._id}
          title={category.categoryName}
          subtitle={category.description || (category.isActive ? "Active" : "Inactive")}
          onEdit={() =>
            setCategoryForm({
              id: category._id,
              categoryName: category.categoryName,
              description: category.description || "",
            })
          }
          onDelete={() => onDeleteCategory(category)}
        />
      ))}
    </AdminSection>
  );
}
