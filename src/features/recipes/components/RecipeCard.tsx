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
import { formatFoodAmount } from "../../planner/utils/unitFormatters";
import { Recipe } from "../types/recipe";

type RecipeCardProps = {
  recipe: Recipe;
  canManage?: boolean;
  disabled?: boolean;
  disabledReason?: string;
  onAddToPlan?: (recipe: Recipe) => void;
  onAddMissingIngredients?: (recipe: Recipe) => void;
  onSaveToRecipes?: (recipe: Recipe) => void;
  onDismiss?: (recipe: Recipe) => void;
  onEdit?: (recipe: Recipe) => void;
  onDelete?: (recipe: Recipe) => void;
};

const difficultyText: Record<string, string> = {
  EASY: "Dễ",
  MEDIUM: "Vừa",
  HARD: "Khó",
};

const sourceTypeText: Record<string, string> = {
  SYSTEM: "Hệ thống",
  USER_CREATED: "Cá nhân",
  AI_GENERATED: "AI gợi ý",
  VIDEO_EXTRACTED: "Từ video",
};

export default function RecipeCard({
  recipe,
  canManage,
  disabled,
  disabledReason,
  onAddToPlan,
  onAddMissingIngredients,
  onSaveToRecipes,
  onDismiss,
  onEdit,
  onDelete,
}: RecipeCardProps) {
  const [detailVisible, setDetailVisible] = useState(false);
  const time = recipe.cookingTime ? `${recipe.cookingTime} phút` : "Chưa đặt";
  const kcal = Math.round(recipe.calories || 0);
  const macro = recipe.macroSummary || { protein: 0, carbs: 0, fat: 0 };
  const missingCount =
    recipe.missingIngredients?.length || recipe.availability?.missingIngredients?.length || 0;
  const isMissingIngredients =
    recipe.availabilityStatus === "MISSING_INGREDIENTS" ||
    recipe.availability?.canSchedule === false ||
    missingCount > 0;

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

  const addMissingIngredients = () => {
    onAddMissingIngredients?.(recipe);
    setDetailVisible(false);
  };

  const saveToRecipes = () => {
    onSaveToRecipes?.(recipe);
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
                {recipe.description || "Công thức sẵn sàng để đưa vào lịch bữa ăn."}
              </Text>
            </View>
            {(canManage || onDismiss) && (
              <View style={styles.actions}>
                {canManage ? (
                  <>
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
                  </>
                ) : null}
                {onDismiss ? (
                  <TouchableOpacity
                    activeOpacity={0.75}
                    onPress={(event) => {
                      event.stopPropagation();
                      onDismiss(recipe);
                    }}
                  >
                    <Ionicons name="close-circle-outline" size={22} color={COLORS.onSurfaceVariant} />
                  </TouchableOpacity>
                ) : null}
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
            <View style={isMissingIngredients ? styles.missingBadge : styles.readyBadge}>
              <Text style={isMissingIngredients ? styles.missingBadgeText : styles.readyBadgeText}>
                {isMissingIngredients
                  ? `Thiếu ${missingCount || 1} nguyên liệu`
                  : "Đủ nguyên liệu"}
              </Text>
            </View>
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
            {isMissingIngredients && onAddMissingIngredients && (
              <TouchableOpacity
                style={styles.shoppingButton}
                activeOpacity={0.75}
                onPress={(event) => {
                  event.stopPropagation();
                  addMissingIngredients();
                }}
              >
                <MaterialCommunityIcons name="basket-plus-outline" size={14} color={COLORS.primary} />
                <Text style={styles.shoppingButtonText}>Danh sách mua</Text>
              </TouchableOpacity>
            )}
            {onSaveToRecipes && (
              <TouchableOpacity
                style={styles.saveRecipeButton}
                activeOpacity={0.75}
                onPress={(event) => {
                  event.stopPropagation();
                  saveToRecipes();
                }}
              >
                <Ionicons name="bookmark-outline" size={14} color={COLORS.onSecondaryContainer} />
                <Text style={styles.saveRecipeButtonText}>Lưu công thức</Text>
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

              <View style={isMissingIngredients ? styles.detailMissingNotice : styles.detailReadyNotice}>
                <MaterialCommunityIcons
                  name={isMissingIngredients ? "basket-plus-outline" : "check-decagram-outline"}
                  size={17}
                  color={isMissingIngredients ? COLORS.onTertiaryFixed : COLORS.primary}
                />
                <Text
                  style={
                    isMissingIngredients
                      ? styles.detailMissingNoticeText
                      : styles.detailReadyNoticeText
                  }
                >
                  {isMissingIngredients
                    ? `Còn thiếu ${missingCount || 1} nguyên liệu. Khi lên lịch, hệ thống sẽ hỏi thêm vào danh sách mua.`
                    : "Tủ thực phẩm hiện tại đủ nguyên liệu để đưa vào lịch bữa ăn."}
                </Text>
              </View>

              <View style={styles.detailMetricGrid}>
                <DetailMetric label="Kcal" value={`${kcal}`} />
                <DetailMetric label="Protein" value={`${Math.round(macro.protein)}g`} />
                <DetailMetric label="Carbs" value={`${Math.round(macro.carbs)}g`} />
                <DetailMetric label="Fat" value={`${Math.round(macro.fat)}g`} />
              </View>

              <View style={styles.detailInfoList}>
                <DetailInfo label="Thời gian" value={time} />
                <DetailInfo label="Độ khó" value={difficultyText[recipe.difficulty || "EASY"] || "Dễ"} />
                <DetailInfo label="Nguồn" value={sourceTypeText[recipe.sourceType || "SYSTEM"] || "Hệ thống"} />
              </View>

              <DetailSection title="Nguyên liệu">
                {recipe.ingredients?.length ? (
                  recipe.ingredients.map((ingredient, index) => (
                    <Text key={`${ingredient.ingredientName}-${index}`} style={styles.detailListText}>
                      {index + 1}. {ingredient.ingredientName} - {formatFoodAmount(ingredient.quantity, ingredient.unit)}
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

              {disabledReason ? (
                <Text style={styles.detailWarning}>{disabledReason}</Text>
              ) : null}

              {isMissingIngredients && onAddMissingIngredients && (
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={styles.detailShoppingButton}
                  onPress={addMissingIngredients}
                >
                  <MaterialCommunityIcons name="basket-plus-outline" size={16} color={COLORS.primary} />
                  <Text style={styles.detailShoppingButtonText}>Thêm nguyên liệu thiếu vào danh sách mua</Text>
                </TouchableOpacity>
              )}

              {onSaveToRecipes && (
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={styles.detailSaveRecipeButton}
                  onPress={saveToRecipes}
                >
                  <Ionicons name="bookmark-outline" size={16} color={COLORS.onSecondaryContainer} />
                  <Text style={styles.detailSaveRecipeButtonText}>Thêm vào công thức cá nhân</Text>
                </TouchableOpacity>
              )}

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
  readyBadge: {
    backgroundColor: "#e7f5ee",
    borderWidth: 1,
    borderColor: "#b7dccb",
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 4,
  },
  readyBadgeText: {
    fontSize: 10,
    fontWeight: "900",
    color: COLORS.primary,
  },
  missingBadge: {
    backgroundColor: COLORS.tertiaryFixed,
    borderWidth: 1,
    borderColor: COLORS.tertiary,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 4,
  },
  missingBadgeText: {
    fontSize: 10,
    fontWeight: "900",
    color: COLORS.onTertiaryFixed,
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
  shoppingButton: {
    minHeight: 25,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: COLORS.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: COLORS.primary,
    paddingHorizontal: 9,
    borderRadius: 4,
  },
  shoppingButtonText: {
    fontSize: 10,
    fontWeight: "900",
    color: COLORS.primary,
  },
  saveRecipeButton: {
    minHeight: 25,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: COLORS.secondaryContainer,
    paddingHorizontal: 9,
    borderRadius: 4,
  },
  saveRecipeButtonText: {
    fontSize: 10,
    fontWeight: "900",
    color: COLORS.onSecondaryContainer,
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
  detailReadyNotice: {
    minHeight: 42,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#b7dccb",
    backgroundColor: "#e7f5ee",
    paddingHorizontal: 11,
    paddingVertical: 9,
    marginBottom: 12,
  },
  detailReadyNoticeText: {
    flex: 1,
    color: COLORS.primary,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "800",
  },
  detailMissingNotice: {
    minHeight: 42,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.tertiary,
    backgroundColor: COLORS.tertiaryFixed,
    paddingHorizontal: 11,
    paddingVertical: 9,
    marginBottom: 12,
  },
  detailMissingNoticeText: {
    flex: 1,
    color: COLORS.onTertiaryFixed,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "800",
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
  detailShoppingButton: {
    minHeight: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.surfaceContainerLowest,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginBottom: 8,
  },
  detailShoppingButtonText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: "900",
  },
  detailSaveRecipeButton: {
    minHeight: 44,
    borderRadius: 8,
    backgroundColor: COLORS.secondaryContainer,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginBottom: 8,
  },
  detailSaveRecipeButtonText: {
    color: COLORS.onSecondaryContainer,
    fontSize: 13,
    fontWeight: "900",
  },
});
