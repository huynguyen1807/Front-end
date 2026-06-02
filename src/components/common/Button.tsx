import {
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableOpacityProps,
} from "react-native";
import { COLORS } from "../../constants/colors";
import { RADIUS, SPACING } from "../../constants/spacing";

type ButtonProps = TouchableOpacityProps & {
  title: string;
  variant?: "primary" | "secondary" | "danger";
};

export default function AppButton({
  title,
  variant = "primary",
  style,
  ...props
}: ButtonProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      style={[styles.base, styles[variant], style]}
      {...props}
    >
      <Text style={[styles.text, variant === "secondary" && styles.secondaryText]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 44,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.md,
    alignItems: "center",
    justifyContent: "center",
  },
  primary: {
    backgroundColor: COLORS.primary,
  },
  secondary: {
    backgroundColor: COLORS.surfaceContainerHigh,
  },
  danger: {
    backgroundColor: COLORS.tertiary,
  },
  text: {
    color: COLORS.onPrimary,
    fontWeight: "700",
    fontSize: 14,
  },
  secondaryText: {
    color: COLORS.onSurfaceVariant,
  },
});