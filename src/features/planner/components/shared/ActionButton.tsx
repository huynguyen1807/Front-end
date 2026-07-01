import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Text, TouchableOpacity } from "react-native";

import { COLORS } from "../../../../constants/colors";
import { plannerStyles as styles } from "../../styles/PlannerScreen.styles";

type ActionButtonProps = {
  label: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  secondary?: boolean;
  disabled?: boolean;
  onPress: () => void;
};

export default function ActionButton({
  label,
  icon,
  secondary,
  disabled,
  onPress,
}: ActionButtonProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.82}
      disabled={disabled}
      onPress={onPress}
      style={[styles.button, secondary && styles.secondaryButton, disabled && styles.disabledButton]}
    >
      <MaterialCommunityIcons
        name={icon}
        size={17}
        color={secondary ? COLORS.primary : COLORS.onPrimary}
      />
      <Text style={[styles.buttonText, secondary && styles.secondaryButtonText]}>{label}</Text>
    </TouchableOpacity>
  );
}
