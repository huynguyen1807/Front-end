import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Image, Modal, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useState } from "react";

import { COLORS } from "../../../constants/colors";
import { InventoryFood, MacroSummary } from "../types/planner";
import { getFoodScheduleRule } from "../utils/foodScheduleRules";
import { getCategoryName, getDaysUntilExpiry } from "../utils/plannerUtils";
import { plannerStyles as styles } from "../styles/PlannerScreen.styles";

type InventoryBucketProps = {
  title: string;
  tone: "warning" | "safe";
  foods: InventoryFood[];
  onAddToPlan: (food: InventoryFood) => void;
};

const emptyMacro: MacroSummary = { protein: 0, carbs: 0, fat: 0 };

function getFoodMacro(food: InventoryFood) {
  return food.macroSummary || food.nutrition?.macroSummary || emptyMacro;
}

function getFoodCalories(food: InventoryFood) {
  return Math.round(food.calories || food.nutrition?.calories || 0);
}

function getStorageName(value?: string | { _id: string; storageName: string; storageType: string }) {
  return typeof value === "string" ? "" : value?.storageName || value?.storageType || "";
}

function expiryText(expiryDate: string) {
  const days = getDaysUntilExpiry(expiryDate);
  if (days < 0) return "Đã hết hạn";
  if (days === 0) return "Hết hạn hôm nay";
  return `Còn ${days} ngày`;
}

export default function InventoryBucket({
  title,
  tone,
  foods,
  onAddToPlan,
}: InventoryBucketProps) {
  const [selectedFood, setSelectedFood] = useState<InventoryFood | null>(null);

  const renderFoodImage = (food: InventoryFood, large = false) => {
    if (food.imageUrl) {
      return (
        <Image
          source={{ uri: food.imageUrl }}
          style={large ? styles.foodDetailImage : styles.foodCardImage}
        />
      );
    }

    return (
      <View
        style={[
          large ? styles.foodDetailImage : styles.foodCardImage,
          styles.foodImagePlaceholder,
        ]}
      >
        <MaterialCommunityIcons name="food-apple-outline" size={large ? 42 : 28} color={COLORS.primary} />
      </View>
    );
  };

  return (
    <View style={styles.bucket}>
      <View style={styles.bucketHeader}>
        <Text style={styles.bucketTitle}>{title}</Text>
        <Text style={[styles.bucketCount, tone === "warning" && styles.bucketWarning]}>
          {foods.length}
        </Text>
      </View>
      {foods.length === 0 ? (
        <Text style={styles.emptyText}>Không có thực phẩm nào trong nhóm này.</Text>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.foodStrip}
        >
          {foods.slice(0, 10).map((food) => {
            const macro = getFoodMacro(food);
            const calories = getFoodCalories(food);
            const scheduleRule = getFoodScheduleRule(food);

            return (
              <TouchableOpacity
                key={food._id}
                activeOpacity={0.82}
                style={[styles.foodCard, tone === "warning" && styles.foodCardWarning]}
                onPress={() => setSelectedFood(food)}
              >
                {renderFoodImage(food)}
                <View style={styles.foodCardBody}>
                  <View>
                    <Text style={styles.foodName} numberOfLines={2}>
                      {food.foodName}
                    </Text>
                    <Text style={styles.foodMeta}>
                      {food.quantity} {food.unit} • {expiryText(food.expiryDate)}
                    </Text>
                  </View>
                  <View style={styles.foodNutrientRow}>
                    <Text style={styles.foodKcal}>{calories} kcal</Text>
                    <Text style={styles.foodMacroText}>P {Math.round(macro.protein)}g</Text>
                    <Text style={styles.foodMacroText}>C {Math.round(macro.carbs)}g</Text>
                    <Text style={styles.foodMacroText}>F {Math.round(macro.fat)}g</Text>
                  </View>
                  <TouchableOpacity
                    disabled={!scheduleRule.canScheduleDirectly}
                    activeOpacity={0.78}
                    style={[
                      styles.foodPlanButton,
                      !scheduleRule.canScheduleDirectly && styles.disabledButton,
                    ]}
                    onPress={(event) => {
                      event.stopPropagation();
                      onAddToPlan(food);
                    }}
                  >
                    <Ionicons name="add" size={14} color={COLORS.onPrimary} />
                    <Text style={styles.foodPlanButtonText}>{scheduleRule.actionLabel}</Text>
                  </TouchableOpacity>
                  {!scheduleRule.canScheduleDirectly ? (
                    <Text style={styles.foodMeta} numberOfLines={2}>
                      {scheduleRule.reason}
                    </Text>
                  ) : null}
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      <Modal
        visible={Boolean(selectedFood)}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedFood(null)}
      >
        <View style={styles.detailBackdrop}>
          {selectedFood && (
            <View style={styles.detailSheet}>
              <View style={styles.detailHeader}>
                <Text style={styles.detailTitle}>{selectedFood.foodName}</Text>
                <TouchableOpacity
                  activeOpacity={0.78}
                  style={styles.detailCloseButton}
                  onPress={() => setSelectedFood(null)}
                >
                  <Ionicons name="close" size={22} color={COLORS.onSurfaceVariant} />
                </TouchableOpacity>
              </View>
              <ScrollView showsVerticalScrollIndicator={false}>
                {renderFoodImage(selectedFood, true)}
                {!getFoodScheduleRule(selectedFood).canScheduleDirectly ? (
                  <View style={styles.inlineNotice}>
                    <MaterialCommunityIcons name="chef-hat" size={18} color={COLORS.primary} />
                    <Text style={styles.inlineNoticeText}>
                      {getFoodScheduleRule(selectedFood).reason}
                    </Text>
                  </View>
                ) : null}
                <View style={styles.detailMetricGrid}>
                  <DetailMetric label="Kcal" value={`${getFoodCalories(selectedFood)}`} />
                  <DetailMetric label="Protein" value={`${Math.round(getFoodMacro(selectedFood).protein)}g`} />
                  <DetailMetric label="Carbs" value={`${Math.round(getFoodMacro(selectedFood).carbs)}g`} />
                  <DetailMetric label="Fat" value={`${Math.round(getFoodMacro(selectedFood).fat)}g`} />
                </View>
                <View style={styles.detailInfoList}>
                  <DetailInfo label="Số lượng" value={`${selectedFood.quantity} ${selectedFood.unit}`} />
                  <DetailInfo label="Hạn dùng" value={expiryText(selectedFood.expiryDate)} />
                  <DetailInfo label="Trạng thái" value={selectedFood.status} />
                  <DetailInfo label="Danh mục" value={getCategoryName(selectedFood.categoryId) || "Chưa phân loại"} />
                  <DetailInfo label="Vị trí lưu trữ" value={getStorageName(selectedFood.storageLocationId) || "Chưa đặt"} />
                </View>
                <TouchableOpacity
                  disabled={!getFoodScheduleRule(selectedFood).canScheduleDirectly}
                  activeOpacity={0.8}
                  style={[
                    styles.detailPrimaryButton,
                    !getFoodScheduleRule(selectedFood).canScheduleDirectly && styles.disabledButton,
                  ]}
                  onPress={() => {
                    onAddToPlan(selectedFood);
                    setSelectedFood(null);
                  }}
                >
                  <Ionicons name="add" size={16} color={COLORS.onPrimary} />
                  <Text style={styles.detailPrimaryButtonText}>Đưa vào lịch bữa ăn</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          )}
        </View>
      </Modal>
    </View>
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
