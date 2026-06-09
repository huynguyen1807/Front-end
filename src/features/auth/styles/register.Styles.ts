import { StyleSheet } from "react-native";
import { COLORS } from "../../../constants/colors";
import { RADIUS, SPACING } from "../../../constants/spacing";

export const registerStyles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  container: {
    flexGrow: 1,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.xxl,
    justifyContent: "center",
  },

  title: {
    fontSize: 32,
    fontWeight: "800",
    color: COLORS.primary,
    marginBottom: SPACING.sm,
  },

  subtitle: {
    fontSize: 15,
    color: COLORS.onSurfaceVariant,
    marginBottom: SPACING.xl,
    lineHeight: 22,
  },

  formGroup: {
    marginBottom: SPACING.lg,
  },

  label: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.onSurface,
    marginBottom: SPACING.sm,
  },

  required: {
    color: COLORS.error,
  },

  input: {
    minHeight: 50,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.lg,
    fontSize: 15,
    color: COLORS.onSurface,
    backgroundColor: COLORS.surfaceContainerLowest,
  },

  inputError: {
    borderColor: COLORS.error,
  },

  errorText: {
    marginTop: 6,
    color: COLORS.error,
    fontSize: 12,
    fontWeight: "600",
  },

  button: {
    minHeight: 52,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    marginTop: SPACING.sm,
  },

  buttonText: {
    color: COLORS.onPrimary,
    fontSize: 16,
    fontWeight: "800",
  },

  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: SPACING.xl,
  },

  footerText: {
    color: COLORS.onSurfaceVariant,
    fontSize: 14,
  },

  loginText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: "800",
  },
});