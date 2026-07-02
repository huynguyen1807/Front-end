import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useState } from "react";
import {
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

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
  const [detailVisible, setDetailVisible] = useState(false);
  const time = recipe.cookingTime ? `${recipe.cookingTime} phút` : "Chưa đặt";
  const kcal = Math.round(recipe.calories || 0);
  const macro = recipe.macroSummary || { protein: 0, carbs: 0, fat: 0 };

  const renderImage = (large = false) => {
    if (recipe.imageUrl) {
      return (
        <Image
          source={{ uri: recipe.imageUrl }}
          style={large ? styles.detailImage : styles.image}
        />
      );
    }

    return (
      <View style={[large ? styles.detailImage : styles.image, styles.imagePlaceholder]}>
        <MaterialCommunityIcons name="food-variant" size={large ? 44 : 34} color={COLORS.primary} />
      </View>
    );
  };

  const addToPlan = () => {
    if (disabled) return;
    onAddToPlan?.(recipe);
    setDetailVisible(false);
  };

  return (
    <>
      <TouchableOpacity
        activeOpacity={0.84}
        style={[styles.card, disabled && styles.disabledCard]}
        onPress={() => setDetailVisible(true)}
      >
        {renderImage()}

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
                <TouchableOpacity
                  activeOpacity={0.75}
                  onPress={(event) => {
                    event.stopPropagation();
                    onEdit?.(recipe);
                  }}
                >
                  <Ionicons name="create-outline" size={23} color={COLORS.onSurfaceVariant} />
                </TouchableOpacity>
                <TouchableOpacity
                  activeOpacity={0.75}
                  onPress={(event) => {
                    event.stopPropagation();
                    onDelete?.(recipe);
                  }}
                >
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
                onPress={(event) => {
                  event.stopPropagation();
                  addToPlan();
                }}
              >
                <Ionicons name="add" size={15} color={COLORS.onPrimary} />
                <Text style={styles.planButtonText}>Lên lịch</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>

      <Modal
        visible={detailVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDetailVisible(false)}
      >
        <View style={styles.detailBackdrop}>
          <View style={styles.detailSheet}>
            <View style={styles.detailHeader}>
              <Text style={styles.detailTitle}>{recipe.recipeName}</Text>
              <TouchableOpacity
                activeOpacity={0.78}
                style={styles.detailCloseButton}
                onPress={() => setDetailVisible(false)}
              >
                <Ionicons name="close" size={22} color={COLORS.onSurfaceVariant} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {renderImage(true)}
              {recipe.description ? (
                <Text style={styles.detailDescription}>{recipe.description}</Text>
              ) : null}

              <View style={styles.detailMetricGrid}>
                <DetailMetric label="Kcal" value={`${kcal}`} />
                <DetailMetric label="Protein" value={`${Math.round(macro.protein)}g`} />
                <DetailMetric label="Carbs" value={`${Math.round(macro.carbs)}g`} />
                <DetailMetric label="Fat" value={`${Math.round(macro.fat)}g`} />
              </View>

              <View style={styles.detailInfoList}>
                <DetailInfo label="Thời gian" value={time} />
                <DetailInfo label="Độ khó" value={recipe.difficulty || "EASY"} />
                <DetailInfo label="Nguồn" value={recipe.sourceType || "SYSTEM"} />
              </View>

              <DetailSection title="Nguyên liệu">
                {recipe.ingredients?.length ? (
                  recipe.ingredients.map((ingredient, index) => (
                    <Text key={`${ingredient.ingredientName}-${index}`} style={styles.detailListText}>
                      {index + 1}. {ingredient.ingredientName} - {ingredient.quantity} {ingredient.unit}
                    </Text>
                  ))
                ) : (
                  <Text style={styles.detailListText}>Chưa có nguyên liệu.</Text>
                )}
              </DetailSection>

              <DetailSection title="Các bước nấu">
                {recipe.cookingSteps?.length ? (
                  recipe.cookingSteps.map((step, index) => (
                    <Text key={`${index}-${step}`} style={styles.detailListText}>
                      {index + 1}. {step}
                    </Text>
                  ))
                ) : (
                  <Text style={styles.detailListText}>Chưa có bước nấu.</Text>
                )}
              </DetailSection>

              {recipe.tags?.length ? (
                <View style={styles.detailTagsRow}>
                  {recipe.tags.map((tag) => (
                    <View key={tag} style={styles.tag}>
                      <Text style={styles.tagText}>{tag}</Text>
                    </View>
                  ))}
                </View>
              ) : null}

              {disabledReason ? (
                <Text style={styles.detailWarning}>{disabledReason}</Text>
              ) : null}

              {onAddToPlan && (
                <TouchableOpacity
                  disabled={disabled}
                  activeOpacity={0.8}
                  style={[styles.detailPrimaryButton, disabled && styles.disabledButton]}
                  onPress={addToPlan}
                >
                  <Ionicons name="add" size={16} color={COLORS.onPrimary} />
                  <Text style={styles.detailPrimaryButtonText}>Đưa vào lịch bữa ăn</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

function DetailMetric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailMetric}>
      <Text style={styles.detailMetricValue}>{value}</Text>
      <Text style={styles.detailMetricLabel}>{label}</Text>
    </View>
  );
}

function DetailInfo({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailInfoRow}>
      <Text style={styles.detailInfoLabel}>{label}</Text>
      <Text style={styles.detailInfoValue}>{value}</Text>
    </View>
  );
}

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.detailSection}>
      <Text style={styles.detailSectionTitle}>{title}</Text>
      {children}
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
  detailBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.36)",
    justifyContent: "center",
    paddingHorizontal: 18,
  },
  detailSheet: {
    maxHeight: "88%",
    borderRadius: 8,
    backgroundColor: COLORS.surface,
    padding: 14,
  },
  detailHeader: {
    minHeight: 42,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 10,
  },
  detailTitle: {
    flex: 1,
    color: COLORS.onSurface,
    fontSize: 20,
    lineHeight: 26,
    fontWeight: "900",
  },
  detailCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.surfaceContainer,
  },
  detailImage: {
    width: "100%",
    height: 190,
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: COLORS.surfaceContainer,
  },
  detailDescription: {
    color: COLORS.onSurfaceVariant,
    fontSize: 13,
    lineHeight: 20,
    fontWeight: "700",
    marginBottom: 12,
  },
  detailMetricGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  detailMetric: {
    flex: 1,
    minWidth: "22%",
    minHeight: 58,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    backgroundColor: COLORS.surfaceContainerLowest,
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  detailMetricValue: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: "900",
  },
  detailMetricLabel: {
    color: COLORS.onSurfaceVariant,
    fontSize: 11,
    fontWeight: "800",
    marginTop: 2,
  },
  detailInfoList: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    backgroundColor: COLORS.surfaceContainerLowest,
    marginBottom: 12,
  },
  detailInfoRow: {
    minHeight: 42,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.outlineVariant,
  },
  detailInfoLabel: {
    color: COLORS.onSurfaceVariant,
    fontSize: 12,
    fontWeight: "800",
  },
  detailInfoValue: {
    flex: 1,
    color: COLORS.onSurface,
    fontSize: 13,
    fontWeight: "800",
    textAlign: "right",
  },
  detailSection: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    backgroundColor: COLORS.surfaceContainerLowest,
    padding: 12,
    marginBottom: 12,
  },
  detailSectionTitle: {
    color: COLORS.onSurface,
    fontSize: 14,
    fontWeight: "900",
    marginBottom: 8,
  },
  detailListText: {
    color: COLORS.onSurfaceVariant,
    fontSize: 13,
    lineHeight: 20,
    fontWeight: "700",
    marginBottom: 4,
  },
  detailTagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
    marginBottom: 12,
  },
  detailWarning: {
    color: COLORS.onTertiaryFixed,
    backgroundColor: COLORS.tertiaryFixed,
    borderRadius: 8,
    padding: 10,
    fontSize: 12,
    fontWeight: "800",
    marginBottom: 12,
  },
  detailPrimaryButton: {
    minHeight: 44,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginBottom: 4,
  },
  detailPrimaryButtonText: {
    color: COLORS.onPrimary,
    fontSize: 13,
    fontWeight: "900",
  },
});
