import { MaterialCommunityIcons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { COLORS } from "../../../constants/colors";
import { RADIUS, SPACING } from "../../../constants/spacing";

export default function WasteCard() {
  return (
    <View style={styles.container}>
      <MaterialCommunityIcons
        name="leaf"
        size={44}
        color={COLORS.onSecondaryContainer}
      />
      <Text style={styles.title}>Giảm 1.2kg rác thải</Text>
      <Text style={styles.subtitle}>Trong tuần này</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.secondaryContainer,
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    marginTop: SPACING.sm,
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.onSecondaryContainer,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.onSecondaryContainer,
    opacity: 0.75,
  },
});