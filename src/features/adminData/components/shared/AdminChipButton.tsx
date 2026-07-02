import { Text, TouchableOpacity } from "react-native";

import { adminDataStyles as styles } from "../../styles/AdminData.styles";

type AdminChipButtonProps = {
  label: string;
  active: boolean;
  onPress: () => void;
};

export default function AdminChipButton({ label, active, onPress }: AdminChipButtonProps) {
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
