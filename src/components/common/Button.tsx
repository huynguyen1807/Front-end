import { ReactNode } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableOpacityProps,
  View,
} from "react-native";
import { COLORS } from "../../constants/colors";
import { RADIUS, SPACING } from "../../constants/spacing";

type ButtonProps = TouchableOpacityProps & {
  title: string;
  variant?: "primary" | "secondary" | "danger" | "outline";
  icon?: ReactNode;
  iconPosition?: "left" | "right";
};

export default function AppButton({
  title,
  variant = "primary",
  style,
  icon,
  iconPosition = "right",
  ...props
}: ButtonProps) {
  const isOutline = variant === "outline";
  const isSecondary = variant === "secondary";

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      style={[styles.base, styles[variant], style]}
      {...props}
    >
      <View style={styles.content}>
        {icon && iconPosition === "left" && icon}
        <Text
          style={[
            styles.text,
            isSecondary && styles.secondaryText,
            isOutline && styles.outlineText,
          ]}
        >
          {title}
        </Text>
        {icon && iconPosition === "right" && icon}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 52,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.md,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.sm,
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
  outline: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
  },
  text: {
    color: COLORS.onPrimary,
    fontWeight: "700",
    fontSize: 15,
  },
  secondaryText: {
    color: COLORS.onSurfaceVariant,
  },
  outlineText: {
    color: COLORS.primary,
  },
});