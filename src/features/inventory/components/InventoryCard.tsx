import { Image, StyleSheet, Text, View } from "react-native";
import { COLORS } from "../../../constants/colors";
import { RADIUS, SPACING } from "../../../constants/spacing";
import { InventoryItem } from "../types/inventory";

type InventoryCardProps = {
  item: InventoryItem;
};

function getStatusColor(percent: number) {
  if (percent <= 25) return COLORS.tertiary;
  if (percent <= 50) return COLORS.secondaryContainer;
  return COLORS.primary;
}

export default function InventoryCard({ item }: InventoryCardProps) {
  const statusColor = getStatusColor(item.freshnessPercent);
  const isUrgent = item.daysLeft <= 1;

  return (
    <View style={styles.card}>
      <View style={styles.imageWrapper}>
        <Image source={{ uri: item.imageUrl }} style={styles.image} />

        {isUrgent && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Cần dùng ngay</Text>
          </View>
        )}
      </View>

      <View style={styles.content}>
        <Text style={styles.name}>{item.name}</Text>

        <Text style={styles.meta}>
          {item.quantity} • {item.storageLabel}
        </Text>

        <View style={styles.progressHeader}>
          <Text style={[styles.daysLeft, { color: statusColor }]}>
            {item.daysLeft} ngày còn lại
          </Text>

          <Text style={styles.percent}>{item.freshnessPercent}%</Text>
        </View>

        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${item.freshnessPercent}%`,
                backgroundColor: statusColor,
              },
            ]}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: RADIUS.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(189, 202, 191, 0.35)",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    elevation: 2,
  },
  imageWrapper: {
    height: 150,
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  badge: {
    position: "absolute",
    top: SPACING.md,
    right: SPACING.md,
    backgroundColor: COLORS.tertiary,
    paddingHorizontal: SPACING.md,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
  },
  badgeText: {
    color: COLORS.onTertiary,
    fontSize: 12,
    fontWeight: "700",
  },
  content: {
    padding: SPACING.lg,
  },
  name: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.onSurface,
  },
  meta: {
    marginTop: 2,
    fontSize: 14,
    color: COLORS.onSurfaceVariant,
  },
  progressHeader: {
    marginTop: SPACING.lg,
    marginBottom: 5,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  daysLeft: {
    fontSize: 12,
    fontWeight: "800",
  },
  percent: {
    fontSize: 12,
    color: COLORS.onSurfaceVariant,
    opacity: 0.65,
  },
  progressTrack: {
    height: 7,
    backgroundColor: COLORS.surfaceContainer,
    borderRadius: RADIUS.full,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: RADIUS.full,
  },
});