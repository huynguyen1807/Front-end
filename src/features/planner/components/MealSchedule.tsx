import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { COLORS } from "../../../constants/colors";
import { MealPlan, MealPlanMeal, MealStatus, ScheduleDate } from "../types/planner";
import TimelineItem from "./TimelineItem";

type MealScheduleProps = {
  dates: ScheduleDate[];
  activeDate: string;
  weekStartDate: string;
  weekEndDate: string;
  plans: MealPlan[];
  onChangeDate: (date: string) => void;
  onChangeWeek: (offset: number) => void;
  onGoToCurrentWeek: () => void;
  onUpdateMealStatus: (plan: MealPlan, mealIndex: number, status: MealStatus) => void;
  onRemoveMeal: (plan: MealPlan, mealIndex: number) => void;
  onDeletePlan: (plan: MealPlan) => void;
};

type SelectedMeal = {
  plan: MealPlan;
  meal: MealPlanMeal;
  mealIndex: number;
};

const mealTypeLabel: Record<string, string> = {
  BREAKFAST: "Sáng",
  LUNCH: "Trưa",
  AFTERNOON: "Chiều",
  DINNER: "Tối",
  LATE_NIGHT: "Khuya",
  SNACK: "Phụ",
};

function getMealTime(meal: MealPlanMeal) {
  if (meal.scheduledTime) return meal.scheduledTime;
  if (meal.mealType === "BREAKFAST") return "08:00";
  if (meal.mealType === "LUNCH") return "12:30";
  if (meal.mealType === "AFTERNOON") return "15:30";
  if (meal.mealType === "DINNER") return "19:00";
  if (meal.mealType === "LATE_NIGHT") return "21:30";
  return "15:30";
}

function getScheduleTotals(plans: MealPlan[]) {
  return plans.reduce(
    (acc, plan) => {
      (plan.meals || []).forEach((meal) => {
        acc.calories += Number(meal.calories) || 0;
        acc.protein += Number(meal.macroSummary?.protein) || 0;
        acc.carbs += Number(meal.macroSummary?.carbs) || 0;
        acc.fat += Number(meal.macroSummary?.fat) || 0;
      });
      return acc;
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
}

function getStatusText(status: MealStatus) {
  if (status === "COMPLETED") return "Đã hoàn thành";
  if (status === "PREPARING") return "Đang chuẩn bị";
  return "Chưa thực hiện";
}

export default function MealSchedule({
  dates,
  activeDate,
  weekStartDate,
  weekEndDate,
  plans,
  onChangeDate,
  onChangeWeek,
  onGoToCurrentWeek,
  onUpdateMealStatus,
  onRemoveMeal,
  onDeletePlan,
}: MealScheduleProps) {
  const [selectedMeal, setSelectedMeal] = useState<SelectedMeal | null>(null);
  const totals = getScheduleTotals(plans);
  const hasMeals = plans.length > 0 && plans.some((plan) => plan.meals.length > 0);
  const selectedMacro = selectedMeal?.meal.macroSummary || { carbs: 0, protein: 0, fat: 0 };

  const updateSelectedMealStatus = (status: MealStatus) => {
    if (!selectedMeal) return;
    onUpdateMealStatus(selectedMeal.plan, selectedMeal.mealIndex, status);
    setSelectedMeal(null);
  };

  const removeSelectedMeal = () => {
    if (!selectedMeal) return;
    onRemoveMeal(selectedMeal.plan, selectedMeal.mealIndex);
    setSelectedMeal(null);
  };

  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>Lịch trình bữa ăn</Text>
        {plans[0] && (
          <TouchableOpacity activeOpacity={0.75} onPress={() => onDeletePlan(plans[0])}>
            <Text style={styles.clearText}>Xóa plan</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.weekNavigation}>
        <TouchableOpacity
          activeOpacity={0.75}
          accessibilityLabel="Tuần trước"
          style={styles.weekIconButton}
          onPress={() => onChangeWeek(-1)}
        >
          <Ionicons name="chevron-back" size={20} color={COLORS.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.75}
          accessibilityLabel="Về tuần hiện tại"
          style={styles.weekRangeButton}
          onPress={onGoToCurrentWeek}
        >
          <Text style={styles.weekRangeLabel}>Tuần hiện tại</Text>
          <Text style={styles.weekRangeValue}>
            {new Date(`${weekStartDate}T00:00:00`).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })}
            {" - "}
            {new Date(`${weekEndDate}T00:00:00`).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.75}
          accessibilityLabel="Tuần sau"
          style={styles.weekIconButton}
          onPress={() => onChangeWeek(1)}
        >
          <Ionicons name="chevron-forward" size={20} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabsScroll}
        contentContainerStyle={styles.tabsContainer}
      >
        {dates.map((date) => {
          const isActive = date.value === activeDate;

          return (
            <TouchableOpacity
              key={date.id}
              activeOpacity={0.75}
              style={[styles.tab, isActive && styles.activeTab]}
              onPress={() => onChangeDate(date.value)}
            >
              <Text style={[styles.tabText, isActive && styles.activeTabText]}>
                {date.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {hasMeals && (
        <View style={styles.summaryGrid}>
          <ScheduleMetric label="Kcal" value={`${Math.round(totals.calories)}`} />
          <ScheduleMetric label="Carbs" value={`${Math.round(totals.carbs)}g`} />
          <ScheduleMetric label="Protein" value={`${Math.round(totals.protein)}g`} />
          <ScheduleMetric label="Fat" value={`${Math.round(totals.fat)}g`} />
        </View>
      )}

      <View style={styles.timeline}>
        {!hasMeals ? (
          <Text style={styles.emptyText}>
            Chưa có bữa ăn trong ngày này. Chọn công thức và bấm Lên lịch.
          </Text>
        ) : (
          plans.map((plan) =>
            plan.meals.map((meal, index) => (
              <TimelineItem
                key={`${plan._id}-${index}`}
                time={getMealTime(meal)}
                title={`${mealTypeLabel[meal.mealType]} - ${meal.recipeName}`}
                kcal={Math.round(meal.calories || 0)}
                status={meal.status}
                statusText={getStatusText(meal.status)}
                onPress={() => setSelectedMeal({ plan, meal, mealIndex: index })}
                onRemove={() => onRemoveMeal(plan, index)}
              />
            ))
          )
        )}
      </View>

      <Modal
        visible={Boolean(selectedMeal)}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedMeal(null)}
      >
        <View style={styles.modalBackdrop}>
          {selectedMeal && (
            <View style={styles.modalSheet}>
              <View style={styles.modalHeader}>
                <View style={styles.modalTitleBlock}>
                  <Text style={styles.modalEyebrow}>
                    {mealTypeLabel[selectedMeal.meal.mealType]} - {getMealTime(selectedMeal.meal)}
                  </Text>
                  <Text style={styles.modalTitle}>{selectedMeal.meal.recipeName}</Text>
                </View>
                <TouchableOpacity
                  activeOpacity={0.78}
                  style={styles.closeButton}
                  onPress={() => setSelectedMeal(null)}
                >
                  <Ionicons name="close" size={22} color={COLORS.onSurfaceVariant} />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.statusPill}>
                  <Ionicons
                    name={
                      selectedMeal.meal.status === "COMPLETED"
                        ? "checkmark-circle"
                        : selectedMeal.meal.status === "PREPARING"
                          ? "time-outline"
                          : "ellipse-outline"
                    }
                    size={18}
                    color={COLORS.primary}
                  />
                  <Text style={styles.statusPillText}>{getStatusText(selectedMeal.meal.status)}</Text>
                </View>

                <View style={styles.detailMetricGrid}>
                  <ScheduleMetric label="Kcal" value={`${Math.round(selectedMeal.meal.calories || 0)}`} />
                  <ScheduleMetric label="Carbs" value={`${Math.round(selectedMacro.carbs)}g`} />
                  <ScheduleMetric label="Protein" value={`${Math.round(selectedMacro.protein)}g`} />
                  <ScheduleMetric label="Fat" value={`${Math.round(selectedMacro.fat)}g`} />
                </View>

                <View style={styles.detailList}>
                  <DetailRow label="Bữa ăn" value={mealTypeLabel[selectedMeal.meal.mealType]} />
                  <DetailRow label="Thời gian" value={getMealTime(selectedMeal.meal)} />
                  <DetailRow label="Trạng thái" value={getStatusText(selectedMeal.meal.status)} />
                </View>

                <View style={styles.actionGrid}>
                  <TouchableOpacity
                    activeOpacity={0.82}
                    style={styles.primaryAction}
                    onPress={() => updateSelectedMealStatus("COMPLETED")}
                  >
                    <Ionicons name="checkmark-circle-outline" size={18} color={COLORS.onPrimary} />
                    <Text style={styles.primaryActionText}>Hoàn thành</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    activeOpacity={0.82}
                    style={styles.secondaryAction}
                    onPress={() => updateSelectedMealStatus("PREPARING")}
                  >
                    <Ionicons name="time-outline" size={18} color={COLORS.primary} />
                    <Text style={styles.secondaryActionText}>Đang chuẩn bị</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    activeOpacity={0.82}
                    style={styles.secondaryAction}
                    onPress={() => updateSelectedMealStatus("PENDING")}
                  >
                    <Ionicons name="refresh-outline" size={18} color={COLORS.primary} />
                    <Text style={styles.secondaryActionText}>Đặt lại</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    activeOpacity={0.82}
                    style={styles.dangerAction}
                    onPress={removeSelectedMeal}
                  >
                    <Ionicons name="trash-outline" size={18} color={COLORS.error} />
                    <Text style={styles.dangerActionText}>Hủy khỏi lịch</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}

function ScheduleMetric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryMetric}>
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: COLORS.onSurface,
  },
  clearText: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.tertiary,
  },
  weekNavigation: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "stretch",
    gap: 8,
    marginBottom: 12,
  },
  weekIconButton: {
    width: 46,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.surfaceContainerLowest,
  },
  weekRangeButton: {
    flex: 1,
    minWidth: 0,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
    backgroundColor: COLORS.surfaceContainer,
  },
  weekRangeLabel: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: "900",
  },
  weekRangeValue: {
    marginTop: 2,
    color: COLORS.onSurface,
    fontSize: 13,
    fontWeight: "800",
  },
  tabsScroll: {
    marginBottom: 16,
  },
  tabsContainer: {
    gap: 10,
  },
  tab: {
    minWidth: 88,
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: COLORS.surfaceContainer,
  },
  activeTab: {
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    elevation: 3,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.onSurfaceVariant,
  },
  activeTabText: {
    color: COLORS.onPrimary,
  },
  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  summaryMetric: {
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
  summaryValue: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: "900",
  },
  summaryLabel: {
    color: COLORS.onSurfaceVariant,
    fontSize: 11,
    fontWeight: "800",
    marginTop: 2,
  },
  timeline: {
    gap: 12,
  },
  emptyText: {
    color: COLORS.onSurfaceVariant,
    fontSize: 14,
    lineHeight: 21,
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(28, 27, 27, 0.42)",
  },
  modalSheet: {
    maxHeight: "86%",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    backgroundColor: COLORS.surface,
    padding: 20,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 16,
  },
  modalTitleBlock: {
    flex: 1,
  },
  modalEyebrow: {
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.primary,
    marginBottom: 4,
  },
  modalTitle: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "900",
    color: COLORS.onSurface,
  },
  closeButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.surfaceContainer,
  },
  statusPill: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 999,
    backgroundColor: COLORS.onPrimaryContainer,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 14,
  },
  statusPillText: {
    fontSize: 13,
    fontWeight: "900",
    color: COLORS.primary,
  },
  detailMetricGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  detailList: {
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    borderRadius: 8,
    backgroundColor: COLORS.surfaceContainerLowest,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(28, 27, 27, 0.08)",
  },
  detailLabel: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.onSurfaceVariant,
  },
  detailValue: {
    flex: 1,
    textAlign: "right",
    fontSize: 14,
    fontWeight: "900",
    color: COLORS.onSurface,
  },
  actionGrid: {
    gap: 10,
    paddingBottom: 10,
  },
  primaryAction: {
    minHeight: 48,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: COLORS.primary,
  },
  primaryActionText: {
    fontSize: 14,
    fontWeight: "900",
    color: COLORS.onPrimary,
  },
  secondaryAction: {
    minHeight: 46,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: COLORS.surfaceContainerLowest,
  },
  secondaryActionText: {
    fontSize: 14,
    fontWeight: "900",
    color: COLORS.primary,
  },
  dangerAction: {
    minHeight: 46,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.tertiaryFixed,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#fff8f7",
  },
  dangerActionText: {
    fontSize: 14,
    fontWeight: "900",
    color: COLORS.error,
  },
});
