import { StyleSheet, Text, TouchableOpacity } from "react-native";
import { COLORS } from "../../constants/colors";
import { RADIUS, SPACING } from "../../constants/spacing";

type FilterChipProps = {
  label: string;
  active?: boolean;
  danger?: boolean;
  onPress?: () => void;
};

export default function FilterChip({
  label,
  active = false,
  danger = false,
  onPress,
}: FilterChipProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={[
        styles.container,
        active && styles.active,
        danger && !active && styles.danger,
      ]}
    >
      <Text
        style={[
          styles.label,
          active && styles.activeLabel,
          danger && !active && styles.dangerLabel,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceContainerHigh,
  },
  active: {
    backgroundColor: COLORS.primary,
  },
  danger: {
    backgroundColor: COLORS.tertiaryFixed,
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.onSurfaceVariant,
  },
  activeLabel: {
    color: COLORS.onPrimary,
  },
  dangerLabel: {
    color: COLORS.onTertiaryFixed,
  },
});