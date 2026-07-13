import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Text, TextInput, TouchableOpacity, View } from "react-native";

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

export default function VideoRecipeExtractor({
  videoUrl,
  extraction,
  onChangeVideoUrl,
  onExtract,
}: VideoRecipeExtractorProps) {
  return (
    <Section
      title="Trích xuất công thức từ video"
      subtitle="Dán link YouTube, TikTok hoặc Facebook để tạo bản nháp công thức từ video."
    >
      <View style={styles.inputWithButton}>
        <TextInput
          style={[styles.input, styles.inputGrow]}
          value={videoUrl}
          onChangeText={onChangeVideoUrl}
          placeholder="https://..."
          placeholderTextColor={COLORS.onSurfaceVariant + "80"}
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
              {ingredient.ingredientName} - {ingredient.quantity} {ingredient.unit}
            </Text>
          ))}
        </View>
      )}
    </Section>
  );
}
