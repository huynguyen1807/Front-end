import { StyleSheet, Text, View } from "react-native";
import { COLORS } from "../../../constants/colors";
import { RADIUS, SPACING } from "../../../constants/spacing";

export default function SummaryCard() {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>TÌNH TRẠNG TỔNG THỂ</Text>
      <Text style={styles.title}>Kho của bạn đang rất tốt!</Text>

      <View style={styles.statsRow}>
        <View>
          <Text style={styles.percent}>84%</Text>
          <Text style={styles.statLabel}>Độ tươi trung bình</Text>
        </View>

        <View style={styles.divider} />

        <View>
          <Text style={styles.number}>3</Text>
          <Text style={styles.statLabel}>Sắp hết hạn</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.primaryContainer,
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
  },
  label: {
    color: COLORS.onPrimaryContainer,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
    opacity: 0.9,
  },
  title: {
    color: COLORS.onPrimaryContainer,
    fontSize: 24,
    lineHeight: 32,
    fontWeight: "800",
    marginTop: 4,
  },
  statsRow: {
    marginTop: SPACING.lg,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: SPACING.lg,
  },
  percent: {
    color: COLORS.onPrimaryContainer,
    fontSize: 48,
    lineHeight: 52,
    fontWeight: "900",
  },
  number: {
    color: COLORS.onPrimaryContainer,
    fontSize: 24,
    fontWeight: "800",
  },
  statLabel: {
    color: COLORS.onPrimaryContainer,
    fontSize: 12,
    fontWeight: "700",
  },
  divider: {
    width: 1,
    height: 48,
    backgroundColor: "rgba(255,255,255,0.25)",
  },
});