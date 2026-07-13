import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { COLORS } from "../../../constants/colors";
import { MealStatus } from "../types/planner";

type TimelineItemProps = {
  time: string;
  title: string;
  statusText?: string;
  kcal: number;
  status: MealStatus;
  onPress?: () => void;
  onRemove?: () => void;
};

export default function TimelineItem({
  time,
  title,
  statusText,
  kcal,
  status,
  onPress,
  onRemove,
}: TimelineItemProps) {
  const isCompleted = status === "COMPLETED";
  const isCurrent = status === "PREPARING";
  const borderColor = isCompleted || isCurrent ? COLORS.primary : "#e0dddd";
  const fallbackStatusText = isCompleted
    ? "Đã hoàn thành"
    : isCurrent
      ? "Đang chuẩn bị"
      : "Chưa thực hiện";

  return (
    <View style={styles.container}>
      <Text style={styles.time}>{time}</Text>

      <TouchableOpacity
        activeOpacity={0.86}
        style={[styles.card, { borderLeftColor: borderColor }]}
        onPress={onPress}
      >
        <View style={styles.content}>
          <Text style={styles.title} numberOfLines={2}>
            {title}
          </Text>
          <Text style={styles.subtitle}>
            {statusText || fallbackStatusText} - {kcal} kcal
          </Text>
        </View>

        <View style={styles.iconButton}>
          {isCompleted && (
            <Ionicons name="checkmark-circle-outline" size={26} color={COLORS.primary} />
          )}
          {isCurrent && (
            <Ionicons name="play-circle-outline" size={27} color={COLORS.onSurfaceVariant} />
          )}
          {!isCompleted && !isCurrent && (
            <View style={styles.plusIcon}>
              <Ionicons name="add" size={20} color={COLORS.primary} />
            </View>
          )}
        </View>
        <TouchableOpacity
          style={styles.removeButton}
          activeOpacity={0.75}
          onPress={(event) => {
            event.stopPropagation();
            onRemove?.();
          }}
        >
          <Ionicons name="close" size={18} color={COLORS.onSurfaceVariant} />
        </TouchableOpacity>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
  },
  time: {
    width: 58,
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.onSurface,
  },
  card: {
    flex: 1,
    minHeight: 82,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: "rgba(28, 27, 27, 0.08)",
    borderLeftWidth: 4,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    elevation: 2,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "800",
    color: COLORS.onSurface,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.onSurfaceVariant,
  },
  iconButton: {
    marginLeft: 12,
  },
  removeButton: {
    width: 28,
    height: 28,
    marginLeft: 6,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.surfaceContainer,
  },
  plusIcon: {
    width: 30,
    height: 30,
    borderRadius: 999,
    backgroundColor: COLORS.surfaceContainer,
    alignItems: "center",
    justifyContent: "center",
  },
});
