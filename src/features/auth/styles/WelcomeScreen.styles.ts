import { StyleSheet } from "react-native";
import { COLORS } from "../../../constants/colors";
import { RADIUS, SPACING } from "../../../constants/spacing";

export const welcomeScreenStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: "space-between",
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.xxl * 1.5,
    paddingBottom: SPACING.xl,
  },
  watermarkContainer: {
    position: "absolute",
    top: "35%",
    left: -40,
    opacity: 0.03,
  },
  headerSection: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: SPACING.xl,
  },
  logoBox: {
    width: 140,
    height: 140,
    borderRadius: 36,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 8,
  },
  logoInner: {
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.primary,
    textAlign: "center",
    marginTop: SPACING.xxl,
    marginBottom: SPACING.md,
  },
  description: {
    fontSize: 15,
    color: COLORS.onSurfaceVariant,
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: SPACING.md,
  },
  buttonSection: {
    width: "100%",
    gap: SPACING.md,
    marginTop: SPACING.xl,
  },
  primaryBtn: {
    flexDirection: "row",
    gap: SPACING.sm,
    justifyContent: "center",
    alignItems: "center",
  },
  btnTextRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.sm,
  },
  outlineBtn: {
    borderColor: COLORS.outlineVariant,
  },
  socialSection: {
    alignItems: "center",
    marginVertical: SPACING.xl,
  },
  avatarGroup: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: SPACING.sm,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.full,
    borderWidth: 2,
    borderColor: COLORS.background,
  },
  avatarOverlap: {
    marginLeft: -10,
  },
  socialText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.onSurfaceVariant,
    textAlign: "center",
  },
  footerText: {
    fontSize: 11,
    color: COLORS.onSurfaceVariant,
    opacity: 0.6,
    textAlign: "center",
    lineHeight: 16,
    marginTop: SPACING.sm,
  },
});
