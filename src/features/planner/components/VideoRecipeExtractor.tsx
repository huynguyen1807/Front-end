import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useState } from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";

import { COLORS } from "../../../constants/colors";
import { VideoRecipeExtraction } from "../types/planner";
import { plannerStyles as styles } from "../styles/PlannerScreen.styles";
import { formatFoodAmount } from "../../../utils/foodUnits";
import Section from "./shared/Section";

type VideoRecipeExtractorProps = {
  videoUrl: string;
  extraction: VideoRecipeExtraction | null;
  onChangeVideoUrl: (value: string) => void;
  onExtract: () => void;
};

const COLLAPSED_STEP_COUNT = 3;

function formatCookingTime(minutes?: number): string | null {
  if (!minutes || minutes <= 0) return null;
  if (minutes < 60) return `${minutes} phút`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours} giờ ${rest} phút` : `${hours} giờ`;
}

function difficultyLabel(difficulty?: string): string | null {
  if (difficulty === "EASY") return "Dễ";
  if (difficulty === "MEDIUM") return "Trung bình";
  if (difficulty === "HARD") return "Khó";
  return null;
}

export default function VideoRecipeExtractor({
  videoUrl,
  extraction,
  onChangeVideoUrl,
  onExtract,
}: VideoRecipeExtractorProps) {
  const [expandedSteps, setExpandedSteps] = useState(false);

  const recipe = extraction?.extractedRecipe;
  const cookingTime = formatCookingTime(recipe?.cookingTime);
  const difficulty = difficultyLabel(recipe?.difficulty);
  const calories = recipe?.calories ? `${Math.round(recipe.calories)} kcal` : null;
  const servings = recipe?.servings ? `${recipe.servings} người` : null;
  const cuisine = recipe?.cuisine || null;
  const macro = recipe?.macroSummary;
  const steps = recipe?.cookingSteps || [];
  const visibleSteps = expandedSteps ? steps : steps.slice(0, COLLAPSED_STEP_COUNT);

  return (
    <Section
      title="Trích xuất công thức từ video"
      subtitle="Dán link YouTube để AI phân tích nội dung và tạo công thức đầy đủ gồm nguyên liệu, các bước nấu, thời gian và dinh dưỡng."
    >
      <View style={styles.inputWithButton}>
        <TextInput
          style={[styles.input, styles.inputGrow]}
          value={videoUrl}
          onChangeText={onChangeVideoUrl}
          placeholder="https://www.youtube.com/watch?v=..."
          placeholderTextColor={COLORS.alpha(COLORS.onSurfaceVariant, "80")}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
        />
        <TouchableOpacity style={styles.squareButton} onPress={onExtract} activeOpacity={0.8}>
          <MaterialCommunityIcons name="video-plus-outline" size={22} color={COLORS.onPrimary} />
        </TouchableOpacity>
      </View>
      {extraction && recipe && (
        <View style={styles.extractionBox}>
          <View style={styles.extractionHeader}>
            <Text style={styles.extractionTitle}>{recipe.recipeName}</Text>
            {difficulty && (
              <View style={styles.extractionBadge}>
                <Text style={styles.extractionBadgeText}>{difficulty}</Text>
              </View>
            )}
          </View>
          <Text style={styles.extractionMeta}>
            {extraction.source.platform} - {extraction.source.status}
          </Text>

          <View style={styles.extractionMetaRow}>
            {cookingTime && (
              <View style={styles.extractionChip}>
                <MaterialCommunityIcons name="clock-outline" size={14} color={COLORS.onSurfaceVariant} />
                <Text style={styles.extractionChipText}>{cookingTime}</Text>
              </View>
            )}
            {calories && (
              <View style={styles.extractionChip}>
                <MaterialCommunityIcons name="fire" size={14} color={COLORS.onSurfaceVariant} />
                <Text style={styles.extractionChipText}>{calories}</Text>
              </View>
            )}
            {servings && (
              <View style={styles.extractionChip}>
                <MaterialCommunityIcons name="account-group-outline" size={14} color={COLORS.onSurfaceVariant} />
                <Text style={styles.extractionChipText}>{servings}</Text>
              </View>
            )}
            {cuisine && (
              <View style={styles.extractionChip}>
                <MaterialCommunityIcons name="silverware-fork-knife" size={14} color={COLORS.onSurfaceVariant} />
                <Text style={styles.extractionChipText}>{cuisine}</Text>
              </View>
            )}
          </View>

          {recipe.description && (
            <Text style={styles.extractionDescription}>{recipe.description}</Text>
          )}

          {macro && (
            <View style={styles.extractionMacroRow}>
              <View style={styles.extractionMacroItem}>
                <Text style={styles.extractionMacroValue}>{Math.round(macro.protein || 0)}g</Text>
                <Text style={styles.extractionMacroLabel}>Protein</Text>
              </View>
              <View style={styles.extractionMacroItem}>
                <Text style={styles.extractionMacroValue}>{Math.round(macro.carbs || 0)}g</Text>
                <Text style={styles.extractionMacroLabel}>Carbs</Text>
              </View>
              <View style={styles.extractionMacroItem}>
                <Text style={styles.extractionMacroValue}>{Math.round(macro.fat || 0)}g</Text>
                <Text style={styles.extractionMacroLabel}>Fat</Text>
              </View>
            </View>
          )}

          <View style={styles.extractionSection}>
            <Text style={styles.extractionSectionTitle}>Nguyên liệu</Text>
            {recipe.ingredients.map((ingredient, index) => (
              <Text key={`${ingredient.ingredientName}-${index}`} style={styles.extractionIngredient}>
                {ingredient.ingredientName} - {formatFoodAmount(ingredient.quantity, ingredient.unit)}
              </Text>
            ))}
          </View>

          {steps.length > 0 && (
            <View style={styles.extractionSection}>
              <Text style={styles.extractionSectionTitle}>Cách làm</Text>
              {visibleSteps.map((step, index) => (
                <View key={`step-${index}`} style={styles.extractionRow}>
                  <Text style={styles.extractionStepNumber}>{index + 1}.</Text>
                  <Text style={styles.extractionStepText}>{step}</Text>
                </View>
              ))}
              {steps.length > COLLAPSED_STEP_COUNT && (
                <TouchableOpacity
                  style={styles.extractionShowMore}
                  onPress={() => setExpandedSteps((value) => !value)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.extractionShowMoreText}>
                    {expandedSteps ? "Thu gọn" : `Xem tất cả ${steps.length} bước`}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          <Text style={styles.extractionHint}>
            Công thức đã được lưu vào tab "Công thức" của bạn.
          </Text>
        </View>
      )}
    </Section>
  );
}
