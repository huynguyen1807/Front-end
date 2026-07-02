import React from "react";
import { TextInput, View } from "react-native";

import {
  StorageRuleFormState,
  emptyStorageRuleForm,
  storageTypeOptions,
} from "../../planner/constants/plannerConstants";
import { StorageRuleData } from "../../planner/types/planner";
import { getCategoryName } from "../../planner/utils/plannerUtils";
import { adminDataStyles as styles } from "../styles/AdminData.styles";
import AdminActionRow from "./shared/AdminActionRow";
import AdminChipButton from "./shared/AdminChipButton";
import AdminDataRow from "./shared/AdminDataRow";
import AdminField from "./shared/AdminField";
import AdminSection from "./shared/AdminSection";

type StorageRulePanelProps = {
  storageRules: StorageRuleData[];
  storageRuleForm: StorageRuleFormState;
  setStorageRuleForm: React.Dispatch<React.SetStateAction<StorageRuleFormState>>;
  saving: boolean;
  onSaveStorageRule: () => void;
  onDeleteStorageRule: (rule: StorageRuleData) => void;
};

export default function StorageRulePanel({
  storageRules,
  storageRuleForm,
  setStorageRuleForm,
  saving,
  onSaveStorageRule,
  onDeleteStorageRule,
}: StorageRulePanelProps) {
  return (
    <AdminSection
      title="Configure Storage Rule"
      subtitle="Quy định hạn dùng gợi ý theo category và vị trí lưu trữ."
    >
      <AdminField label="Food category">
        <TextInput
          style={styles.input}
          value={storageRuleForm.categoryName}
          onChangeText={(value) =>
            setStorageRuleForm((form) => ({ ...form, categoryName: value }))
          }
          placeholder="Vegetables"
        />
      </AdminField>
      <AdminField label="Storage location type">
        <View style={styles.segmentRow}>
          {storageTypeOptions.map((option) => (
            <AdminChipButton
              key={option.key}
              label={option.label}
              active={storageRuleForm.storageType === option.key}
              onPress={() =>
                setStorageRuleForm((form) => ({ ...form, storageType: option.key }))
              }
            />
          ))}
        </View>
      </AdminField>
      <View style={styles.formGrid}>
        <AdminField label="Estimated days">
          <TextInput
            style={styles.input}
            value={storageRuleForm.estimatedDays}
            keyboardType="numeric"
            onChangeText={(value) =>
              setStorageRuleForm((form) => ({ ...form, estimatedDays: value }))
            }
            placeholder="7"
          />
        </AdminField>
        <AdminField label="Priority">
          <TextInput
            style={styles.input}
            value={storageRuleForm.priority}
            keyboardType="numeric"
            onChangeText={(value) =>
              setStorageRuleForm((form) => ({ ...form, priority: value }))
            }
            placeholder="0"
          />
        </AdminField>
      </View>
      <AdminField label="Instruction">
        <TextInput
          style={[styles.input, styles.textArea]}
          value={storageRuleForm.instruction}
          onChangeText={(value) =>
            setStorageRuleForm((form) => ({ ...form, instruction: value }))
          }
          multiline
          placeholder="Keep sealed, dry, below 4C..."
        />
      </AdminField>
      <AdminField label="Warning message">
        <TextInput
          style={styles.input}
          value={storageRuleForm.warningMessage}
          onChangeText={(value) =>
            setStorageRuleForm((form) => ({ ...form, warningMessage: value }))
          }
          placeholder="Check smell before cooking"
        />
      </AdminField>
      <AdminActionRow
        primaryLabel={storageRuleForm.id ? "Update rule" : "Save rule"}
        primaryIcon="fridge-outline"
        onPrimary={onSaveStorageRule}
        disabled={saving}
        onCancel={storageRuleForm.id ? () => setStorageRuleForm(emptyStorageRuleForm) : undefined}
      />
      {storageRules.map((rule) => (
        <AdminDataRow
          key={rule._id}
          title={`${getCategoryName(rule.categoryId)} - ${rule.storageType}`}
          subtitle={`${rule.estimatedDays} days - ${rule.instruction || "No instruction"}`}
          onEdit={() =>
            setStorageRuleForm({
              id: rule._id,
              categoryName: getCategoryName(rule.categoryId),
              storageType: rule.storageType,
              estimatedDays: String(rule.estimatedDays),
              instruction: rule.instruction || "",
              warningMessage: rule.warningMessage || "",
              priority: String(rule.priority || 0),
            })
          }
          onDelete={() => onDeleteStorageRule(rule)}
        />
      ))}
    </AdminSection>
  );
}
