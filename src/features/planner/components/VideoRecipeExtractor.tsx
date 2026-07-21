import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useState } from "react";
import { ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";

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
      {extraction && (
        <View style={styles.extractionBox}>
          <Text style={styles.extractionTitle}>{extraction.extractedRecipe.recipeName}</Text>
          <Text style={styles.extractionMeta}>
            {extraction.source.platform} - {extraction.source.status}
          </Text>
          {extraction.extractedRecipe.ingredients.map((ingredient, index) => (
            <Text key={`${ingredient.ingredientName}-${index}`} style={styles.extractionIngredient}>
              {ingredient.ingredientName} - {formatFoodAmount(ingredient.quantity, ingredient.unit)}
            </Text>
          ))}
        </View>
      )}
    </Section>
  );
}
