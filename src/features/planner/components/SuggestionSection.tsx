import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { COLORS } from "../../../constants/colors";
import RecipeCard from "../../recipes/components/RecipeCard";
import { Recipe } from "../types/planner";

type SuggestionSectionProps = {
  recipes: Recipe[];
  loading?: boolean;
  isAdmin?: boolean;
  onAddToPlan: (recipe: Recipe) => void;
  onEditRecipe: (recipe: Recipe) => void;
  onDeleteRecipe: (recipe: Recipe) => void;
};

export default function SuggestionSection({
  recipes,
  loading,
  isAdmin,
  onAddToPlan,
  onEditRecipe,
  onDeleteRecipe,
}: SuggestionSectionProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <MaterialCommunityIcons
            name="star-four-points-outline"
            size={24}
            color={COLORS.primary}
          />
          <Text style={styles.title}>Gợi ý hôm nay</Text>
        </View>
      </View>

      <View style={styles.banner}>
        <Text style={styles.bannerText}>
          Dữ liệu công thức được dùng để lên lịch bữa ăn, tự tính calorie và macro.
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={styles.loader} />
      ) : recipes.length === 0 ? (
        <Text style={styles.emptyText}>Chưa có dữ liệu công thức. Hãy tạo công thức đầu tiên.</Text>
      ) : (
        recipes.map((recipe) => (
          <RecipeCard
            key={recipe._id}
            recipe={recipe}
            canManage={isAdmin || recipe.sourceType === "USER_CREATED"}
            onAddToPlan={onAddToPlan}
            onEdit={onEditRecipe}
            onDelete={onDeleteRecipe}
          />
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 28,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: COLORS.onSurface,
    marginLeft: 8,
  },
  banner: {
    backgroundColor: "#fff1c7",
    borderColor: COLORS.secondaryContainer,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderRadius: 8,
    marginBottom: 16,
  },
  bannerText: {
    color: COLORS.onSurface,
    fontSize: 14,
    lineHeight: 21,
  },
  loader: {
    marginVertical: 20,
  },
  emptyText: {
    color: COLORS.onSurfaceVariant,
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 12,
  },
});
