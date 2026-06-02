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
});
