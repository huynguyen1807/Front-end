import React from "react";
import { Text, TextInput, View } from "react-native";

import AdminActionButton from "../../adminData/components/shared/AdminActionButton";
import AdminChipButton from "../../adminData/components/shared/AdminChipButton";
import AdminField from "../../adminData/components/shared/AdminField";
import AdminSection from "../../adminData/components/shared/AdminSection";
import { adminDataStyles as styles } from "../../adminData/styles/AdminData.styles";
import { NutritionCalculation } from "../../nutrition/types/nutrition";
import {
  RecipeFormState,
  createEmptyRecipeForm,
  createEmptyRecipeIngredient,
} from "../../planner/constants/plannerConstants";
import { Recipe } from "../types/recipe";
import RecipeCard from "./RecipeCard";

type RecipeAdminPanelProps = {
  adminRecipes: Recipe[];
  recipeForm: RecipeFormState;
  setRecipeForm: React.Dispatch<React.SetStateAction<RecipeFormState>>;
  calculation: NutritionCalculation | null;
  saving: boolean;
  onSaveRecipe: () => void;
  onDeleteRecipe: (recipe: Recipe) => void;
  onEditRecipe: (recipe: Recipe) => void;
  onResetRecipe: () => void;
  onCalculateRecipeNutrition: () => void;
};

const difficultyOptions: Array<{ key: RecipeFormState["difficulty"]; label: string }> = [
  { key: "EASY", label: "Dễ" },
  { key: "MEDIUM", label: "Vừa" },
  { key: "HARD", label: "Khó" },
];

export default function RecipeAdminPanel({
  adminRecipes,
  recipeForm,
  setRecipeForm,
  calculation,
  saving,
  onSaveRecipe,
  onDeleteRecipe,
  onEditRecipe,
  onResetRecipe,
  onCalculateRecipeNutrition,
}: RecipeAdminPanelProps) {
  const resetForm = () => {
    setRecipeForm(createEmptyRecipeForm());
    onResetRecipe();
  };

  const updateFirstIngredient = (
    patch: Partial<{ ingredientName: string; quantity: string; unit: string }>
  ) => {
    setRecipeForm((form) => {
      const ingredients = form.ingredients?.length
        ? form.ingredients
        : [createEmptyRecipeIngredient()];
      const nextIngredient = {
        ...ingredients[0],
        ...(patch.ingredientName !== undefined ? { ingredientName: patch.ingredientName } : {}),
        ...(patch.quantity !== undefined ? { quantity: patch.quantity } : {}),
        ...(patch.unit !== undefined ? { unit: patch.unit } : {}),
      };

      return {
        ...form,
        ...(patch.ingredientName !== undefined ? { ingredientName: patch.ingredientName } : {}),
        ...(patch.quantity !== undefined ? { ingredientQuantity: patch.quantity } : {}),
        ...(patch.unit !== undefined ? { ingredientUnit: patch.unit } : {}),
        ingredients: [nextIngredient, ...ingredients.slice(1)],
      };
    });
  };

  return (
    <AdminSection
      title="Create Recipe"
      subtitle="CRUD recipe chính thức cho AI recommendation và meal plan."
    >
      <AdminField label="Recipe name">
        <TextInput
          style={styles.input}
          value={recipeForm.recipeName}
          onChangeText={(value) =>
            setRecipeForm((form) => ({ ...form, recipeName: value }))
          }
        />
      </AdminField>
      <AdminField label="Description">
        <TextInput
          style={[styles.input, styles.textArea]}
          value={recipeForm.description}
          multiline
          onChangeText={(value) =>
            setRecipeForm((form) => ({ ...form, description: value }))
          }
        />
      </AdminField>
      <AdminField label="Image URL">
        <TextInput
          style={styles.input}
          value={recipeForm.imageUrl}
          onChangeText={(value) => setRecipeForm((form) => ({ ...form, imageUrl: value }))}
          placeholder="https://..."
        />
      </AdminField>
      <View style={styles.formGrid}>
        <AdminField label="Cooking time">
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={recipeForm.cookingTime}
            onChangeText={(value) =>
              setRecipeForm((form) => ({ ...form, cookingTime: value }))
            }
          />
        </AdminField>
        <AdminField label="Tags">
          <TextInput
            style={styles.input}
            value={recipeForm.tags}
            onChangeText={(value) => setRecipeForm((form) => ({ ...form, tags: value }))}
            placeholder="healthy, low carb"
          />
        </AdminField>
      </View>
      <AdminField label="Difficulty">
        <View style={styles.segmentRow}>
          {difficultyOptions.map((item) => (
            <AdminChipButton
              key={item.key}
              label={item.label}
              active={recipeForm.difficulty === item.key}
              onPress={() =>
                setRecipeForm((form) => ({ ...form, difficulty: item.key }))
              }
            />
          ))}
        </View>
      </AdminField>
      <View style={styles.formGrid}>
        <AdminField label="Ingredient">
          <TextInput
            style={styles.input}
            value={recipeForm.ingredientName}
            onChangeText={(value) => updateFirstIngredient({ ingredientName: value })}
          />
        </AdminField>
        <AdminField label="Quantity">
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={recipeForm.ingredientQuantity}
            onChangeText={(value) => updateFirstIngredient({ quantity: value })}
          />
        </AdminField>
        <AdminField label="Unit">
          <TextInput
            style={styles.input}
            value={recipeForm.ingredientUnit}
            onChangeText={(value) => updateFirstIngredient({ unit: value })}
          />
        </AdminField>
      </View>
      <View style={styles.formGrid}>
        <AdminField label="Calories">
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={recipeForm.calories}
            onChangeText={(value) =>
              setRecipeForm((form) => ({ ...form, calories: value }))
            }
          />
        </AdminField>
        <AdminField label="Protein">
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={recipeForm.protein}
            onChangeText={(value) =>
              setRecipeForm((form) => ({ ...form, protein: value }))
            }
          />
        </AdminField>
        <AdminField label="Carbs">
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={recipeForm.carbs}
            onChangeText={(value) => setRecipeForm((form) => ({ ...form, carbs: value }))}
          />
        </AdminField>
        <AdminField label="Fat">
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={recipeForm.fat}
            onChangeText={(value) => setRecipeForm((form) => ({ ...form, fat: value }))}
          />
        </AdminField>
      </View>
      {calculation && (
        <Text style={styles.hint}>
          Calculated: {calculation.calories} kcal - P {calculation.macroSummary.protein}g - C{" "}
          {calculation.macroSummary.carbs}g - F {calculation.macroSummary.fat}g
        </Text>
      )}
      <View style={styles.actionRow}>
        <AdminActionButton
          label="Calculate"
          icon="calculator-variant-outline"
          secondary
          onPress={onCalculateRecipeNutrition}
        />
        <AdminActionButton
          label={recipeForm.id ? "Update recipe" : "Create recipe"}
          icon="content-save-outline"
          onPress={onSaveRecipe}
          disabled={saving}
        />
        {recipeForm.id && (
          <AdminActionButton label="Hủy" icon="close" secondary onPress={resetForm} />
        )}
      </View>
      {adminRecipes.map((recipe) => (
        <RecipeCard
          key={recipe._id}
          recipe={recipe}
          canManage
          onEdit={onEditRecipe}
          onDelete={onDeleteRecipe}
        />
      ))}
    </AdminSection>
  );
}
