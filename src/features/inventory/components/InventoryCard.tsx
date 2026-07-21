import React, { useRef, useState } from "react";
import { Animated, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import { MaterialIcons } from "@expo/vector-icons";
import { COLORS } from "../../../constants/colors";
import { RADIUS, SPACING } from "../../../constants/spacing";
import { FoodItem } from "../types/inventory";
import { formatFoodAmount } from "../../../utils/foodUnits";
import {
  FOOD_STATUS_CONFIG,
  getCategoryDisplayName,
  getDaysLeft,
  getInventoryUrgencyLabel,
} from "../utils/inventoryDisplay";

type InventoryCardProps = {
  item: FoodItem;
  onEdit?: () => void;
  onDelete?: () => void;
  onConsume?: () => void;
  onPress?: () => void;
};

export default function InventoryCard({ item, onEdit, onDelete, onConsume, onPress }: InventoryCardProps) {
  const swipeableRef = useRef<Swipeable>(null);

  const cfg = FOOD_STATUS_CONFIG[item.status] ?? FOOD_STATUS_CONFIG.SAFE;
  const daysLeft = getDaysLeft(item.expiryDate);
  const freshnessScore = item.freshnessScore ?? 0;
  const urgentLabel = getInventoryUrgencyLabel(item);

  const handleDelete = () => {
    swipeableRef.current?.close();
    onDelete?.();
  };

  const renderRightAction = (
    _progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>
  ) => {
    const scale = dragX.interpolate({
      inputRange: [-90, 0],
      outputRange: [1, 0.65],
      extrapolate: "clamp",
    });

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        style={styles.deleteSwipeAction}
        onPress={handleDelete}
      >
        <Animated.View style={[styles.deleteSwipeInner, { transform: [{ scale }] }]}>
          <MaterialIcons name="delete-outline" size={24} color={COLORS.onTertiary} />
          <Text style={styles.deleteSwipeText}>Xoá</Text>
        </Animated.View>
      </TouchableOpacity>
    );
  };

  const card = (
    <TouchableOpacity activeOpacity={0.8} style={styles.card} onPress={onPress}>
      {/* Small thumbnail on the left */}
      <View style={styles.thumbnailWrapper}>
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.thumbnail} />
        ) : (
          <View style={[styles.thumbnail, styles.thumbnailPlaceholder]}>
            <MaterialIcons name="fastfood" size={24} color={COLORS.primary + "80"} />
          </View>
        )}
        {urgentLabel && (
          <View style={styles.urgentBadge}>
            <Text style={styles.urgentBadgeText}>!</Text>
          </View>
        )}
      </View>

      {/* Content on the right */}
      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text style={styles.name} numberOfLines={1}>{item.foodName}</Text>
          <Text style={[styles.daysLeft, { color: cfg.color }]}>
            {daysLeft > 0 ? `${daysLeft} ngày` : daysLeft === 0 ? "Hôm nay" : `Quá ${Math.abs(daysLeft)} ngày`}
          </Text>
        </View>

        <View style={styles.midRow}>
          <Text style={styles.meta} numberOfLines={1}>
            {formatFoodAmount(item.quantity, item.unit)} • {getCategoryDisplayName(item.categoryId)}
          </Text>
        </View>

        {/* Freshness Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${freshnessScore}%`, backgroundColor: cfg.color }]} />
          </View>
          <View style={[styles.statusBadge, { backgroundColor: cfg.color + "22" }]}>
            <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.label}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (!onDelete) return card;

  return (
    <Swipeable
      ref={swipeableRef}
      friction={2}
      overshootRight={false}
      rightThreshold={45}
      renderRightActions={renderRightAction}
      onSwipeableOpen={(direction) => {
        if (direction === "right") {
          handleDelete();
        }
      }}
    >
      {card}
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: RADIUS.lg,
    padding: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: "rgba(189, 202, 191, 0.35)",
    shadowColor: "#000",
    shadowOpacity: 0.02,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  thumbnailWrapper: {
    position: 'relative',
  },
  thumbnail: {
    width: 64,
    height: 64,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceContainer,
  },
  thumbnailPlaceholder: {
    justifyContent: "center",
    alignItems: "center",
  },
  urgentBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: COLORS.tertiary,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.surfaceContainerLowest,
  },
  urgentBadgeText: {
    color: COLORS.onTertiary,
    fontSize: 10,
    fontWeight: "900",
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  name: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.onSurface,
    flex: 1,
    marginRight: 8,
  },
  daysLeft: {
    fontSize: 12,
    fontWeight: "800",
  },
  midRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  meta: {
    fontSize: 13,
    color: COLORS.onSurfaceVariant,
    flex: 1,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressTrack: {
    flex: 1,
    height: 6,
    backgroundColor: COLORS.surfaceContainer,
    borderRadius: RADIUS.full,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: RADIUS.full,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "700",
  },
  deleteSwipeAction: {
    width: 80,
    marginLeft: 8,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.tertiary,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteSwipeInner: {
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  deleteSwipeText: {
    color: COLORS.onTertiary,
    fontSize: 11,
    fontWeight: "800",
  },
});

