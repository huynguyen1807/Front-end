import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { COLORS } from "../../../constants/colors";
import { MealPlan, MealPlanMeal, ScheduleDate } from "../types/planner";
import TimelineItem from "./TimelineItem";

type MealScheduleProps = {
  dates: ScheduleDate[];
  activeDate: string;
  plans: MealPlan[];
  onChangeDate: (date: string) => void;
  onCycleMealStatus: (plan: MealPlan, mealIndex: number) => void;
  onRemoveMeal: (plan: MealPlan, mealIndex: number) => void;
  onDeletePlan: (plan: MealPlan) => void;
};

const mealTypeLabel: Record<string, string> = {
  BREAKFAST: "Sáng",
  LUNCH: "Trưa",
  DINNER: "Tối",
  SNACK: "Phụ",
};

function getMealTime(meal: MealPlanMeal) {
  if (meal.scheduledTime) return meal.scheduledTime;
  if (meal.mealType === "BREAKFAST") return "08:00";
  if (meal.mealType === "LUNCH") return "12:30";
  if (meal.mealType === "DINNER") return "19:00";
  return "15:30";
}

export default function MealSchedule({
  dates,
  activeDate,
  plans,
  onChangeDate,
  onCycleMealStatus,
  onRemoveMeal,
  onDeletePlan,
}: MealScheduleProps) {
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

      <View style={styles.timeline}>
        {plans.length === 0 || plans.every((plan) => plan.meals.length === 0) ? (
          <Text style={styles.emptyText}>
            Chưa có bữa ăn trong ngày này. Chọn recipe và bấm Lên lịch.
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
                onPress={() => onCycleMealStatus(plan, index)}
                onRemove={() => onRemoveMeal(plan, index)}
              />
            ))
          )
        )}
      </View>
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
  tabsScroll: {
    marginBottom: 20,
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
  timeline: {
    gap: 12,
  },
  emptyText: {
    color: COLORS.onSurfaceVariant,
    fontSize: 14,
    lineHeight: 21,
  },
});
