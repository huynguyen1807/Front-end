import React from "react";
import { ScrollView, View } from "react-native";

import NutritionAdminPanel from "../../nutrition/components/NutritionAdminPanel";
import {
  AdminSection as AdminSectionType,
  CategoryFormState,
  NutritionFactFormState,
  RecipeFormState,
  StorageRuleFormState,
} from "../../planner/constants/plannerConstants";
import {
  AiGeneratedData,
  FoodCategoryData,
  NutritionCalculation,
  NutritionFact,
  Recipe,
  StorageRuleData,
} from "../../planner/types/planner";
import RecipeAdminPanel from "../../recipes/components/RecipeAdminPanel";
import { adminDataStyles as styles } from "../styles/AdminData.styles";
import AiReviewPanel from "./AiReviewPanel";
import FoodCategoryPanel from "./FoodCategoryPanel";
import StorageRulePanel from "./StorageRulePanel";
import AdminChipButton from "./shared/AdminChipButton";
import AdminSection from "./shared/AdminSection";

type AdminDataConsoleProps = {
  activeSection: AdminSectionType;
  onChangeSection: (section: AdminSectionType) => void;
  categories: FoodCategoryData[];
  storageRules: StorageRuleData[];
  nutritionFacts: NutritionFact[];
  adminRecipes: Recipe[];
  aiReviewItems: AiGeneratedData[];
  categoryForm: CategoryFormState;
  setCategoryForm: React.Dispatch<React.SetStateAction<CategoryFormState>>;
  storageRuleForm: StorageRuleFormState;
  setStorageRuleForm: React.Dispatch<React.SetStateAction<StorageRuleFormState>>;
  factForm: NutritionFactFormState;
  setFactForm: React.Dispatch<React.SetStateAction<NutritionFactFormState>>;
  recipeForm: RecipeFormState;
  setRecipeForm: React.Dispatch<React.SetStateAction<RecipeFormState>>;
  calculation: NutritionCalculation | null;
  saving: boolean;
  onSaveCategory: () => void;
  onDeleteCategory: (category: FoodCategoryData) => void;
  onSaveStorageRule: () => void;
  onDeleteStorageRule: (rule: StorageRuleData) => void;
  onSaveNutritionFact: () => void;
  onDeleteNutritionFact: (fact: NutritionFact) => void;
  onSaveRecipe: () => void;
  onDeleteRecipe: (recipe: Recipe) => void;
  onEditRecipe: (recipe: Recipe) => void;
  onResetRecipe: () => void;
  onCalculateRecipeNutrition: () => void;
  onReviewAiData: (item: AiGeneratedData, action: "APPROVE" | "REJECT") => void;
};

const adminTabs: Array<{ key: AdminSectionType; label: string }> = [
  { key: "category", label: "Food Category" },
  { key: "storage", label: "Storage Rule" },
  { key: "nutrition", label: "Nutrition Data" },
  { key: "recipe", label: "Recipe CRUD" },
  { key: "review", label: "AI Review" },
];

export default function AdminDataConsole({
  activeSection,
  onChangeSection,
  categories,
  storageRules,
  nutritionFacts,
  adminRecipes,
  aiReviewItems,
  categoryForm,
  setCategoryForm,
  storageRuleForm,
  setStorageRuleForm,
  factForm,
  setFactForm,
  recipeForm,
  setRecipeForm,
  calculation,
  saving,
  onSaveCategory,
  onDeleteCategory,
  onSaveStorageRule,
  onDeleteStorageRule,
  onSaveNutritionFact,
  onDeleteNutritionFact,
  onSaveRecipe,
  onDeleteRecipe,
  onEditRecipe,
  onResetRecipe,
  onCalculateRecipeNutrition,
  onReviewAiData,
}: AdminDataConsoleProps) {
  return (
    <View>
      <AdminSection
        title="Admin Data Management"
        subtitle="Recipe CRUD, category, storage rule, nutrition data và review AI-generated data chỉ dành cho ADMIN."
      >
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.adminTabs}>
          {adminTabs.map((tab) => (
            <AdminChipButton
              key={tab.key}
              label={tab.label}
              active={activeSection === tab.key}
              onPress={() => onChangeSection(tab.key)}
            />
          ))}
        </ScrollView>
      </AdminSection>

      {activeSection === "category" && (
        <FoodCategoryPanel
          categories={categories}
          categoryForm={categoryForm}
          setCategoryForm={setCategoryForm}
          saving={saving}
          onSaveCategory={onSaveCategory}
          onDeleteCategory={onDeleteCategory}
        />
      )}

      {activeSection === "storage" && (
        <StorageRulePanel
          storageRules={storageRules}
          storageRuleForm={storageRuleForm}
          setStorageRuleForm={setStorageRuleForm}
          saving={saving}
          onSaveStorageRule={onSaveStorageRule}
          onDeleteStorageRule={onDeleteStorageRule}
        />
      )}

      {activeSection === "nutrition" && (
        <NutritionAdminPanel
          nutritionFacts={nutritionFacts}
          factForm={factForm}
          setFactForm={setFactForm}
          saving={saving}
          onSaveNutritionFact={onSaveNutritionFact}
          onDeleteNutritionFact={onDeleteNutritionFact}
        />
      )}

      {activeSection === "recipe" && (
        <RecipeAdminPanel
          adminRecipes={adminRecipes}
          recipeForm={recipeForm}
          setRecipeForm={setRecipeForm}
          calculation={calculation}
          saving={saving}
          onSaveRecipe={onSaveRecipe}
          onDeleteRecipe={onDeleteRecipe}
          onEditRecipe={onEditRecipe}
          onResetRecipe={onResetRecipe}
          onCalculateRecipeNutrition={onCalculateRecipeNutrition}
        />
      )}

      {activeSection === "review" && (
        <AiReviewPanel
          aiReviewItems={aiReviewItems}
          saving={saving}
          onReviewAiData={onReviewAiData}
        />
      )}
    </View>
  );
}
