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

export default function MealSchedule({
  dates,
  activeDate,
  plans,
  onChangeDate,
  onCycleMealStatus,
  onRemoveMeal,
  onDeletePlan,
}: MealScheduleProps) {
  const totals = getScheduleTotals(plans);
  const hasMeals = plans.length > 0 && plans.some((plan) => plan.meals.length > 0);

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

function ScheduleMetric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryMetric}>
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
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
});
