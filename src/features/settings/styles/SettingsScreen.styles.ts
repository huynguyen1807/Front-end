import { StyleSheet } from "react-native";
import { COLORS } from "../../../constants/colors";
import { RADIUS, SPACING } from "../../../constants/spacing";

export const settingsScreenStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xxl + 40,
  },
  // Profile Section
  profileSection: {
    backgroundColor: COLORS.surfaceContainer,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  profileHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.md,
  },
  profileTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.onSurfaceVariant,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  editButtonText: {
    color: COLORS.primary,
    fontWeight: "600",
    fontSize: 12,
  },
  profileContent: {
    flexDirection: "row",
    gap: SPACING.lg,
    alignItems: "center",
  },
  profileAvatar: {
    width: 64,
    height: 64,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primaryContainer,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.onSurface,
    marginBottom: SPACING.sm,
  },
  profileEmail: {
    fontSize: 14,
    color: COLORS.onSurfaceVariant,
  },

  // Section Container
  sectionContainer: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.onSurfaceVariant,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.sm,
  },
  sectionWrapper: {
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: RADIUS.xl,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.outlineVariant + "20",
    elevation: 1,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },

  // Settings Item
  settingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.outlineVariant + "30",
  },
  settingItemLast: {
    borderBottomWidth: 0,
  },
  settingItemContent: {
    flex: 1,
    flexDirection: "row",
    gap: SPACING.lg,
    alignItems: "center",
  },
  settingIconContainer: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primaryContainer + "30",
    justifyContent: "center",
    alignItems: "center",
  },
  settingTextContent: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: COLORS.onSurface,
    marginBottom: SPACING.xs,
  },
  settingDescription: {
    fontSize: 14,
    color: COLORS.onSurfaceVariant,
  },

  // Toggle Switch
  toggleSwitch: {
    width: 44,
    height: 24,
    borderRadius: RADIUS.full,
    borderWidth: 2,
    borderColor: "transparent",
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: RADIUS.full,
    backgroundColor: "#fff",
  },

  // Logout Button
  logoutContainer: {
    marginTop: SPACING.xl,
    marginBottom: SPACING.xl,
  },
  logoutButton: {
    height: 56,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.error,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: SPACING.md,
  },
  logoutButtonText: {
    color: COLORS.error,
    fontSize: 18,
    fontWeight: "600",
  },

  // Footer
  footer: {
    alignItems: "center",
    paddingVertical: SPACING.xxl,
    opacity: 0.4,
  },
  footerBrand: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },
  footerSubtitle: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.onSurface,
    letterSpacing: 0.5,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalContent: {
    width: "100%",
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: 24,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalHeader: {
    alignItems: "center",
    marginBottom: 24,
  },
  modalIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.onSurface,
    marginBottom: 8,
    textAlign: "center",
  },
  modalSubtitle: {
    fontSize: 14,
    color: COLORS.onSurfaceVariant,
    textAlign: "center",
    lineHeight: 20,
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
  },
  modalButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  modalCancelButton: {
    backgroundColor: COLORS.surfaceContainerHighest,
  },
  modalConfirmButton: {
    backgroundColor: COLORS.primary,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  supportInput: {
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    borderRadius: 8,
    padding: 12,
    height: 120,
    fontSize: 14,
    color: COLORS.onSurface,
    backgroundColor: COLORS.surfaceContainerLowest,
    marginBottom: 24,
  },
  sectionTitleModal: {
    alignSelf: 'flex-start',
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.onSurface,
    marginBottom: 8,
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
    width: '100%',
  },
  categoryBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    backgroundColor: COLORS.surfaceContainerLowest,
  },
  categoryBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  categoryBtnText: {
    fontSize: 13,
    color: COLORS.onSurfaceVariant,
  },
  categoryBtnTextActive: {
    color: COLORS.onPrimary,
    fontWeight: '600',
  }
});
