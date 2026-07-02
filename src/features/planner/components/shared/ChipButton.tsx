import { Text, TouchableOpacity } from "react-native";

import { plannerStyles as styles } from "../../styles/PlannerScreen.styles";

type ChipButtonProps = {
  label: string;
  active: boolean;
  onPress: () => void;
};

export default function ChipButton({ label, active, onPress }: ChipButtonProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      style={[styles.chip, active && styles.chipActive]}
      onPress={onPress}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}
