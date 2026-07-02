import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { COLORS } from "../../../constants/colors";
import { Recipe } from "../types/recipe";

type RecipeCardProps = {
  recipe: Recipe;
  canManage?: boolean;
  disabled?: boolean;
  disabledReason?: string;
  onAddToPlan?: (recipe: Recipe) => void;
  onEdit?: (recipe: Recipe) => void;
  onDelete?: (recipe: Recipe) => void;
};

export default function RecipeCard({
  recipe,
  canManage,
  disabled,
  disabledReason,
  onAddToPlan,
  onEdit,
  onDelete,
}: RecipeCardProps) {
  const time = recipe.cookingTime ? `${recipe.cookingTime} phút` : "Chưa đặt";
  const kcal = Math.round(recipe.calories || 0);
  const macro = recipe.macroSummary || { protein: 0, carbs: 0, fat: 0 };

  return (
    <View style={[styles.card, disabled && styles.disabledCard]}>
      {recipe.imageUrl ? (
        <Image source={{ uri: recipe.imageUrl }} style={styles.image} />
      ) : (
        <View style={[styles.image, styles.imagePlaceholder]}>
          <MaterialCommunityIcons name="food-variant" size={34} color={COLORS.primary} />
        </View>
      )}

      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.titleBlock}>
            <Text style={styles.title} numberOfLines={2}>
              {recipe.recipeName}
            </Text>
            <Text style={styles.description} numberOfLines={2}>
              {recipe.description || "Công thức sẵn sàng để đưa vào meal plan."}
            </Text>
          </View>
          {canManage && (
            <View style={styles.actions}>
              <TouchableOpacity activeOpacity={0.75} onPress={() => onEdit?.(recipe)}>
                <Ionicons name="create-outline" size={23} color={COLORS.onSurfaceVariant} />
              </TouchableOpacity>
              <TouchableOpacity activeOpacity={0.75} onPress={() => onDelete?.(recipe)}>
                <Ionicons name="trash-outline" size={22} color={COLORS.tertiary} />
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.meta}>
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={14} color={COLORS.onSurface} />
            <Text style={styles.metaText}>{time}</Text>
          </View>
          <View style={styles.metaItem}>
            <MaterialCommunityIcons name="fire" size={15} color={COLORS.primary} />
            <Text style={styles.kcalText}>{kcal} kcal</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="barbell-outline" size={14} color={COLORS.onSurface} />
            <Text style={styles.metaText}>P {Math.round(macro.protein)}g</Text>
          </View>
        </View>

        <View style={styles.tagsRow}>
          {(recipe.tags || []).slice(0, 3).map((tag) => (
            <View key={tag} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
          <View style={styles.tag}>
            <Text style={styles.tagText}>C {Math.round(macro.carbs)}g</Text>
          </View>
          <View style={styles.tag}>
            <Text style={styles.tagText}>F {Math.round(macro.fat)}g</Text>
          </View>
          {disabledReason && (
            <View style={styles.warningTag}>
              <Text style={styles.warningTagText} numberOfLines={1}>{disabledReason}</Text>
            </View>
          )}
          {onAddToPlan && (
            <TouchableOpacity
              disabled={disabled}
              style={[styles.planButton, disabled && styles.disabledButton]}
              activeOpacity={0.75}
              onPress={() => onAddToPlan(recipe)}
            >
              <Ionicons name="add" size={15} color={COLORS.onPrimary} />
              <Text style={styles.planButtonText}>Lên lịch</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 142,
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    flexDirection: "row",
    overflow: "hidden",
    marginBottom: 14,
  },
  disabledCard: {
    opacity: 0.48,
  },
  image: {
    width: 122,
    minHeight: 142,
    backgroundColor: COLORS.surfaceContainer,
  },
  imagePlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    justifyContent: "space-between",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 10,
  },
  titleBlock: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: "900",
    color: COLORS.onSurface,
  },
  description: {
    marginTop: 3,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "600",
    color: COLORS.onSurfaceVariant,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  meta: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 10,
    marginTop: 8,
    marginBottom: 10,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  metaText: {
    fontSize: 12,
    color: COLORS.onSurface,
    marginLeft: 4,
    fontWeight: "700",
  },
  kcalText: {
    fontSize: 12,
    color: COLORS.primary,
    marginLeft: 4,
    fontWeight: "900",
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
  },
  tag: {
    backgroundColor: COLORS.surfaceContainer,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 4,
  },
  tagText: {
    fontSize: 10,
    fontWeight: "800",
    color: COLORS.onSurfaceVariant,
  },
  warningTag: {
    maxWidth: "100%",
    backgroundColor: COLORS.tertiaryFixed,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 4,
  },
  warningTagText: {
    fontSize: 10,
    fontWeight: "800",
    color: COLORS.onTertiaryFixed,
  },
  planButton: {
    minHeight: 25,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 9,
    borderRadius: 4,
  },
  disabledButton: {
    backgroundColor: COLORS.onSurfaceVariant,
  },
  planButtonText: {
    fontSize: 10,
    fontWeight: "800",
    color: COLORS.onPrimary,
  },
});
