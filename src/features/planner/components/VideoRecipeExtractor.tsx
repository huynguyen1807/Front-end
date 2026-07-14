import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useState } from "react";
import { ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";

import { COLORS } from "../../../constants/colors";
import { VideoRecipeExtraction } from "../types/planner";
import { plannerStyles as styles } from "../styles/PlannerScreen.styles";
import Section from "./shared/Section";

type VideoRecipeExtractorProps = {
  videoUrl: string;
  extraction: VideoRecipeExtraction | null;
  onChangeVideoUrl: (value: string) => void;
  onExtract: () => void;
};

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
          placeholderTextColor={COLORS.onSurfaceVariant + "80"}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
        />
        <TouchableOpacity style={styles.squareButton} onPress={onExtract} activeOpacity={0.8}>
          <MaterialCommunityIcons name="video-plus-outline" size={22} color={COLORS.onPrimary} />
        </TouchableOpacity>
      </View>

      <Text style={styles.extractionHint}>
        Hiện tại hỗ trợ link YouTube công khai. TikTok và Facebook sẽ được bổ sung sau.
      </Text>

      {extraction && recipe && (
        <ScrollView
          style={styles.extractionBox}
          contentContainerStyle={{ paddingBottom: 8 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.extractionHeader}>
            <Text style={styles.extractionTitle}>{recipe.recipeName}</Text>
            <View style={styles.extractionBadge}>
              <Text style={styles.extractionBadgeText}>
                {extraction.source.platform}
              </Text>
            </View>
          </View>

          {(cuisine || cookingTime || difficulty || calories || servings) && (
            <View style={styles.extractionMetaRow}>
              {cuisine && (
                <View style={styles.extractionChip}>
                  <MaterialCommunityIcons name="silverware-fork-knife" size={14} color={COLORS.primary} />
                  <Text style={styles.extractionChipText}>{cuisine}</Text>
                </View>
              )}
              {cookingTime && (
                <View style={styles.extractionChip}>
                  <MaterialCommunityIcons name="clock-outline" size={14} color={COLORS.primary} />
                  <Text style={styles.extractionChipText}>{cookingTime}</Text>
                </View>
              )}
              {difficulty && (
                <View style={styles.extractionChip}>
                  <MaterialCommunityIcons name="signal" size={14} color={COLORS.primary} />
                  <Text style={styles.extractionChipText}>{difficulty}</Text>
                </View>
              )}
              {calories && (
                <View style={styles.extractionChip}>
                  <MaterialCommunityIcons name="fire" size={14} color={COLORS.primary} />
                  <Text style={styles.extractionChipText}>{calories}</Text>
                </View>
              )}
              {servings && (
                <View style={styles.extractionChip}>
                  <MaterialCommunityIcons name="account-group" size={14} color={COLORS.primary} />
                  <Text style={styles.extractionChipText}>{servings}</Text>
                </View>
              )}
            </View>
          )}

          {recipe.description && (
            <Text style={styles.extractionDescription}>{recipe.description}</Text>
          )}

          {recipe.ingredients.length > 0 && (
            <View style={styles.extractionSection}>
              <Text style={styles.extractionSectionTitle}>Nguyên liệu</Text>
              {recipe.ingredients.map((ingredient, index) => (
                <View key={`${ingredient.ingredientName}-${index}`} style={styles.extractionRow}>
                  <MaterialCommunityIcons
                    name="circle-medium"
                    size={16}
                    color={COLORS.primary}
                  />
                  <Text style={styles.extractionIngredient}>
                    {ingredient.ingredientName} — {ingredient.quantity} {ingredient.unit}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {recipe.cookingSteps.length > 0 && (
            <View style={styles.extractionSection}>
              <Text style={styles.extractionSectionTitle}>Công thức nấu</Text>
              {(expandedSteps ? recipe.cookingSteps : recipe.cookingSteps.slice(0, 4)).map(
                (step, index) => (
                  <View key={`step-${index}`} style={styles.extractionRow}>
                    <Text style={styles.extractionStepNumber}>{index + 1}.</Text>
                    <Text style={styles.extractionStepText}>{step}</Text>
                  </View>
                )
              )}
              {recipe.cookingSteps.length > 4 && (
                <TouchableOpacity
                  onPress={() => setExpandedSteps(!expandedSteps)}
                  style={styles.extractionShowMore}
                >
                  <Text style={styles.extractionShowMoreText}>
                    {expandedSteps ? "Thu gọn" : `Xem thêm ${recipe.cookingSteps.length - 4} bước`}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {macro && (macro.protein > 0 || macro.carbs > 0 || macro.fat > 0) && (
            <View style={styles.extractionSection}>
              <Text style={styles.extractionSectionTitle}>Dinh dưỡng ước tính / khẩu phần</Text>
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
            </View>
          )}

          {recipe.notes && (
            <View style={styles.extractionSection}>
              <Text style={styles.extractionSectionTitle}>Mẹo & lưu ý</Text>
              <Text style={styles.extractionDescription}>{recipe.notes}</Text>
            </View>
          )}
        </ScrollView>
      )}
    </Section>
  );
}