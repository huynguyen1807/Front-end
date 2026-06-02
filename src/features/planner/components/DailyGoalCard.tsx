import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { DimensionValue, StyleSheet, Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";

import { COLORS } from "../../../constants/colors";

export default function DailyGoalCard() {
  const currentKcal = 1200;
  const totalKcal = 2000;
  const remainingKcal = totalKcal - currentKcal;
  const percentage = currentKcal / totalKcal;

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
        <Text style={styles.currentKcal}>1,200</Text>
        <Text style={styles.totalKcal}> / 2,000 kcal</Text>
      </View>

      <Text style={styles.subtitle}>
        Bạn còn {remainingKcal} kcal cho bữa tối!
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
        <MacroBar label="Carbs" percent="45%" color="#8a6900" />
        <MacroBar label="Protein" percent="30%" color={COLORS.primary} />
        <MacroBar label="Fat" percent="25%" color={COLORS.tertiary} />
      </View>
    </View>
  );
}

function MacroBar({
  label,
  percent,
  color,
}: {
  label: string;
  percent: string;
  color: string;
}) {
  const progressWidth = percent as DimensionValue;

  return (
    <View style={styles.macroCol}>
      <View style={styles.macroHeader}>
        <Text style={styles.macroLabel}>{label}</Text>
        <Text style={styles.macroPercent}>{percent}</Text>
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
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(28, 27, 27, 0.09)",
    paddingHorizontal: 26,
    paddingVertical: 26,
    alignItems: "center",
    marginBottom: 34,
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
    fontWeight: "700",
    color: COLORS.onSurface,
    marginBottom: 8,
    letterSpacing: 1,
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
    marginBottom: 26,
  },
  chartContainer: {
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 28,
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
    marginBottom: 22,
  },
  macrosContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    gap: 16,
  },
  macroCol: {
    flex: 1,
  },
  macroHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  macroLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.onSurface,
  },
  macroPercent: {
    fontSize: 13,
    fontWeight: "700",
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
