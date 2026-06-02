import { TouchableOpacity, View } from "react-native";
import { COLORS } from "../../../constants/colors";
import { settingsScreenStyles as styles } from "../styles/SettingsScreen.styles";

interface SettingsToggleProps {
  value: boolean;
  onChange: (value: boolean) => void;
  enabled?: boolean;
}

export default function SettingsToggle({
  value,
  onChange,
  enabled = true,
}: SettingsToggleProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      disabled={!enabled}
      onPress={() => onChange(!value)}
      style={[
        styles.toggleSwitch,
        {
          backgroundColor: value ? COLORS.primaryContainer : COLORS.surfaceContainer,
          borderColor: value ? COLORS.primaryContainer : COLORS.outlineVariant + "50",
        },
      ]}
    >
      <View
        style={[
          styles.toggleThumb,
          {
            alignSelf: value ? "flex-end" : "flex-start",
          },
        ]}
      />
    </TouchableOpacity>
  );
}
