import React, { useRef, useState } from "react";
import { Animated, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import { MaterialIcons } from "@expo/vector-icons";
import { COLORS } from "../../../constants/colors";
import { RADIUS, SPACING } from "../../../constants/spacing";
import { FoodItem } from "../types/inventory";
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
  const [menuOpen, setMenuOpen] = useState(false);
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
    <TouchableOpacity activeOpacity={0.9} style={styles.card} onPress={onPress}>
      {/* Image + badge */}
      <View style={styles.imageWrapper}>
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.image} />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder]}>
            <MaterialIcons name="fastfood" size={40} color={COLORS.primary + "60"} />
          </View>
        )}
        {urgentLabel && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{urgentLabel}</Text>
          </View>
        )}
        {/* Status badge */}
        <View style={[styles.statusBadge, { backgroundColor: cfg.color + "22" }]}>
          <MaterialIcons name={cfg.icon as keyof typeof MaterialIcons.glyphMap} size={12} color={cfg.color} />
          <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.label}</Text>
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>{item.foodName}</Text>
          {/* Menu button */}
          <TouchableOpacity onPress={() => setMenuOpen((v) => !v)} style={styles.menuBtn}>
            <MaterialIcons name="more-vert" size={20} color={COLORS.onSurfaceVariant} />
          </TouchableOpacity>
        </View>

        <Text style={styles.meta}>
          {item.quantity} {item.unit}
          {item.storageLocationId?.storageName ? ` • ${item.storageLocationId.storageName}` : ""}
        </Text>

        <Text style={styles.category}>
          {getCategoryDisplayName(item.categoryId)}
        </Text>

        {/* Freshness bar */}
        <View style={styles.progressHeader}>
          <Text style={[styles.daysLeft, { color: cfg.color }]}>
            {daysLeft > 0 ? `${daysLeft} ngày còn lại` : daysLeft === 0 ? "Hết hạn hôm nay" : `Quá hạn ${Math.abs(daysLeft)} ngày`}
          </Text>
          <Text style={styles.percent}>{freshnessScore}%</Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${freshnessScore}%`, backgroundColor: cfg.color }]} />
        </View>

        {/* Action menu */}
        {menuOpen && (
          <View style={styles.actionRow}>
            {onEdit && (
              <TouchableOpacity style={styles.actionBtn} onPress={() => { setMenuOpen(false); onEdit(); }}>
                <MaterialIcons name="edit" size={16} color={COLORS.primary} />
                <Text style={[styles.actionText, { color: COLORS.primary }]}>Sửa</Text>
              </TouchableOpacity>
            )}
            {onConsume && (
              <TouchableOpacity style={styles.actionBtn} onPress={() => { setMenuOpen(false); onConsume(); }}>
                <MaterialIcons name="check-circle-outline" size={16} color="#16A34A" />
                <Text style={[styles.actionText, { color: "#16A34A" }]}>Đã dùng</Text>
              </TouchableOpacity>
            )}
            {onDelete && (
              <TouchableOpacity style={styles.actionBtn} onPress={() => { setMenuOpen(false); onDelete(); }}>
                <MaterialIcons name="delete-outline" size={16} color={COLORS.tertiary} />
                <Text style={[styles.actionText, { color: COLORS.tertiary }]}>Xoá</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
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
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(189, 202, 191, 0.35)",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  imageWrapper: { height: 140, position: "relative" },
  image: { width: "100%", height: "100%" },
  imagePlaceholder: { backgroundColor: COLORS.surfaceContainer, justifyContent: "center", alignItems: "center" },
  badge: {
    position: "absolute", top: SPACING.md, right: SPACING.md,
    backgroundColor: COLORS.tertiary, paddingHorizontal: SPACING.md, paddingVertical: 5,
    borderRadius: RADIUS.full,
  },
  badgeText: { color: COLORS.onTertiary, fontSize: 12, fontWeight: "700" },
  statusBadge: {
    position: "absolute", bottom: SPACING.sm, left: SPACING.sm,
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: RADIUS.full,
  },
  statusText: { fontSize: 11, fontWeight: "700" },
  content: { padding: SPACING.lg },
  nameRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  name: { fontSize: 16, fontWeight: "800", color: COLORS.onSurface, flex: 1 },
  menuBtn: { padding: 4 },
  meta: { marginTop: 2, fontSize: 13, color: COLORS.onSurfaceVariant },
  category: { fontSize: 12, color: COLORS.primary, marginTop: 2, fontWeight: "600" },
  progressHeader: {
    marginTop: SPACING.lg, marginBottom: 5,
    flexDirection: "row", justifyContent: "space-between",
  },
  daysLeft: { fontSize: 12, fontWeight: "800" },
  percent: { fontSize: 12, color: COLORS.onSurfaceVariant, opacity: 0.65 },
  progressTrack: {
    height: 7, backgroundColor: COLORS.surfaceContainer,
    borderRadius: RADIUS.full, overflow: "hidden",
  },
  progressFill: { height: "100%", borderRadius: RADIUS.full },
  actionRow: {
    flexDirection: "row", gap: 8, marginTop: SPACING.md,
    paddingTop: SPACING.md, borderTopWidth: 1, borderTopColor: COLORS.outlineVariant,
  },
  actionBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 4, paddingVertical: 8, borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceContainer,
  },
  actionText: { fontSize: 12, fontWeight: "700" },
  deleteSwipeAction: {
    width: 92,
    marginLeft: 10,
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
    fontSize: 12,
    fontWeight: "800",
  },
});

