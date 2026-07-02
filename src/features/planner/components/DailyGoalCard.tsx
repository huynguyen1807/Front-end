import { MaterialCommunityIcons } from "@expo/vector-icons";
import { DimensionValue, StyleSheet, Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";

import { COLORS } from "../../../constants/colors";
import { MacroSummary } from "../types/planner";

type DailyGoalCardProps = {
  currentCalories: number;
  targetCalories?: number;
  macroSummary?: MacroSummary;
};

export default function DailyGoalCard({
  currentCalories,
  targetCalories = 2000,
  macroSummary = { protein: 0, carbs: 0, fat: 0 },
}: DailyGoalCardProps) {
  const currentKcal = Math.round(currentCalories);
  const totalKcal = Math.max(1, targetCalories);
  const remainingKcal = totalKcal - currentKcal;
  const percentage = Math.max(0, Math.min(1, currentKcal / totalKcal));
  const totalMacros = macroSummary.protein + macroSummary.carbs + macroSummary.fat;
  const macroPercent = (value: number) =>
    totalMacros > 0 ? Math.round((value / totalMacros) * 100) : 0;

  const radius = 48;
  const strokeWidth = 10;
  const size = 132;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - percentage * circumference;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>MỤC TIÊU HẰNG NGÀY</Text>

      <View style={styles.calorieRow}>
        <Text style={styles.currentKcal}>{currentKcal.toLocaleString("vi-VN")}</Text>
        <Text style={styles.totalKcal}> / {totalKcal.toLocaleString("vi-VN")} kcal</Text>
      </View>

      <Text style={styles.subtitle}>
        {remainingKcal >= 0
          ? `Bạn còn ${remainingKcal.toLocaleString("vi-VN")} kcal cho hôm nay`
          : `Bạn đã vượt ${Math.abs(remainingKcal).toLocaleString("vi-VN")} kcal`}
      </Text>

      <View style={styles.chartContainer}>
        <Svg height={size} width={size} viewBox={`0 0 ${size} ${size}`}>
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke="#e5e1e1"
            strokeWidth={strokeWidth}
            fill="none"
          />
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke={COLORS.primary}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            rotation="-90"
            origin={`${center}, ${center}`}
          />
        </Svg>
        <View style={styles.iconContainer}>
          <MaterialCommunityIcons
            name="silverware-fork-knife"
            size={31}
            color={COLORS.primary}
          />
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.macrosContainer}>
        <MacroBar
          label="Carbs"
          grams={macroSummary.carbs}
          percent={macroPercent(macroSummary.carbs)}
          color="#8a6900"
        />
        <MacroBar
          label="Protein"
          grams={macroSummary.protein}
          percent={macroPercent(macroSummary.protein)}
          color={COLORS.primary}
        />
        <MacroBar
          label="Fat"
          grams={macroSummary.fat}
          percent={macroPercent(macroSummary.fat)}
          color={COLORS.tertiary}
        />
      </View>
    </View>
  );
}

function MacroBar({
  label,
  grams,
  percent,
  color,
}: {
  label: string;
  grams: number;
  percent: number;
  color: string;
}) {
  const progressWidth = `${Math.min(100, Math.max(0, percent))}%` as DimensionValue;

  return (
    <View style={styles.macroCol}>
      <View style={styles.macroHeader}>
        <Text style={styles.macroLabel}>{label}</Text>
        <Text style={styles.macroPercent}>{Math.round(grams)}g</Text>
      </View>
      <View style={styles.progressBarBg}>
        <View
          style={[
            styles.progressBarFill,
            { width: progressWidth, backgroundColor: color },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surfaceContainer,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(28, 27, 27, 0.09)",
    paddingHorizontal: 24,
    paddingVertical: 24,
    alignItems: "center",
    marginBottom: 24,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    elevation: 2,
  },
  title: {
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.onSurface,
    marginBottom: 8,
    letterSpacing: 0,
  },
  calorieRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 4,
  },
  currentKcal: {
    fontSize: 46,
    lineHeight: 54,
    fontWeight: "900",
    color: COLORS.primary,
  },
  totalKcal: {
    fontSize: 17,
    color: COLORS.onSurface,
    fontWeight: "500",
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.onSurfaceVariant,
    marginBottom: 24,
    textAlign: "center",
  },
  chartContainer: {
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  iconContainer: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
  },
  divider: {
    width: "100%",
    height: 1,
    backgroundColor: "rgba(28, 27, 27, 0.08)",
    marginBottom: 20,
  },
  macrosContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    gap: 14,
  },
  macroCol: {
    flex: 1,
    minWidth: 0,
  },
  macroHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
    gap: 6,
  },
  macroLabel: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.onSurface,
  },
  macroPercent: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.onSurface,
  },
  progressBarBg: {
    height: 5,
    backgroundColor: "#e2dddd",
    borderRadius: 999,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 999,
  },
});
