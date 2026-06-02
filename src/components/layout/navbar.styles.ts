import { StyleSheet } from "react-native";
import { COLORS } from "../../constants/colors";
import { RADIUS, SPACING } from "../../constants/spacing";

export const topNavbarStyles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING.lg,
    backgroundColor: COLORS.surface,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceContainer,
  },

  leftGroup: {
    flexDirection: "row",
    alignItems: "center",
  },

  rightGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },

  brand: {
    fontSize: 26,
    fontWeight: "800",
    color: COLORS.primary,
  },

  iconButton: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.full,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },

  dot: {
    width: 9,
    height: 9,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.error,
    position: "absolute",
    top: 8,
    right: 8,
  },
});

export const bottomNavbarStyles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.outlineVariant,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingHorizontal: SPACING.sm,
  },

  item: {
    minWidth: 62,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },

  activeItem: {
    backgroundColor: COLORS.secondaryContainer,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
  },



  label: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.onSurfaceVariant,
  },

  activeLabel: {
    color: COLORS.onSecondaryContainer,
  },
});