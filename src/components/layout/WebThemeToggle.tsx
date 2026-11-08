import { MaterialIcons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text } from "react-native";
import { useWebTheme } from "../../theme/WebThemeProvider";

export default function WebThemeToggle({ compact = false }: { compact?: boolean }) {
  const { mode, toggle } = useWebTheme();
  const nextMode = mode === "dark" ? "sáng" : "tối";

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Chuyển sang giao diện ${nextMode}`}
      onPress={toggle}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      <MaterialIcons
        name={mode === "dark" ? "light-mode" : "dark-mode"}
        size={19}
        color="var(--ff-primary)"
      />
      {!compact && (
        <Text style={styles.label}>
          {mode === "dark" ? "Giao diện tối" : "Giao diện sáng"}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 40,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 13,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "var(--ff-outline-variant)",
    backgroundColor: "var(--ff-surface)",
    boxShadow: "0 4px 16px rgba(16, 46, 37, 0.12)",
  },
  label: {
    color: "var(--ff-on-surface)",
    fontSize: 13,
    fontWeight: "700",
  },
  pressed: {
    opacity: 0.78,
  },
});
