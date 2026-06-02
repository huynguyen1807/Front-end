import { StyleSheet } from "react-native";
import { COLORS } from "../../../constants/colors";
import { RADIUS, SPACING } from "../../../constants/spacing";

export const inventoryScreenStyles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xl,
  },
  summaryWrapper: {
    gap: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  chipRow: {
    gap: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  cardList: {
    gap: SPACING.xl,
  },
  fab: {
    position: "absolute",
    right: SPACING.xl,
    width: 58,
    height: 58,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    elevation: 6,
  },
});
