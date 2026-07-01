import { StyleSheet } from "react-native";

import { COLORS } from "../../../constants/colors";
import { SPACING } from "../../../constants/spacing";

export const adminDataStyles = StyleSheet.create({
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: "900",
    color: COLORS.onSurface,
  },
  sectionSubtitle: {
    marginTop: 4,
    color: COLORS.onSurfaceVariant,
    fontSize: 13,
    lineHeight: 19,
  },
  formGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  field: {
    flex: 1,
    minWidth: 144,
  },
  fieldLabel: {
    color: COLORS.onSurfaceVariant,
    fontSize: 12,
    fontWeight: "800",
    marginBottom: 5,
  },
  input: {
    minHeight: 46,
    backgroundColor: COLORS.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    color: COLORS.onSurface,
    fontSize: 14,
    marginBottom: 10,
  },
  textArea: {
    minHeight: 76,
    textAlignVertical: "top",
  },
  segmentRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  chip: {
    minHeight: 36,
    borderRadius: 999,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    backgroundColor: COLORS.surfaceContainer,
  },
  chipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipText: {
    color: COLORS.onSurfaceVariant,
    fontWeight: "800",
    fontSize: 13,
  },
  chipTextActive: {
    color: COLORS.onPrimary,
  },
  actionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 2,
    marginBottom: 10,
  },
  button: {
    minHeight: 42,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 8,
    paddingHorizontal: 14,
    backgroundColor: COLORS.primary,
  },
  secondaryButton: {
    backgroundColor: COLORS.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
  },
  disabledButton: {
    opacity: 0.55,
  },
  buttonText: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.onPrimary,
  },
  secondaryButtonText: {
    color: COLORS.primary,
  },
  adminTabs: {
    gap: 8,
    paddingRight: SPACING.lg,
  },
  dataRow: {
    minHeight: 64,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    backgroundColor: COLORS.surfaceContainerLowest,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
  },
  dataText: {
    flex: 1,
  },
  dataTitle: {
    color: COLORS.onSurface,
    fontSize: 15,
    fontWeight: "900",
    marginBottom: 2,
  },
  dataSubtitle: {
    color: COLORS.onSurfaceVariant,
    fontSize: 12,
    lineHeight: 17,
  },
  iconButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.surfaceContainer,
    marginLeft: 8,
  },
  reviewItem: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    backgroundColor: COLORS.surfaceContainerLowest,
    padding: 12,
    marginBottom: 12,
  },
  reviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  reviewType: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: "900",
  },
  reviewStatus: {
    color: COLORS.onSurfaceVariant,
    fontSize: 12,
    fontWeight: "800",
  },
  reviewContent: {
    color: COLORS.onSurfaceVariant,
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 10,
  },
  hint: {
    color: COLORS.primary,
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 10,
  },
  emptyText: {
    color: COLORS.onSurfaceVariant,
    fontSize: 14,
    lineHeight: 21,
  },
});
