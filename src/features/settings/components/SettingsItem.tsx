import { Ionicons } from "@expo/vector-icons";
import { TouchableOpacity, View, Text } from "react-native";
import { COLORS } from "../../../constants/colors";
import { settingsScreenStyles as styles } from "../styles/SettingsScreen.styles";

interface SettingsItemProps {
  icon: string;
  label: string;
  description?: string;
  iconColor?: string;
  onPress?: () => void;
  showChevron?: boolean;
  isLast?: boolean;
  children?: React.ReactNode;
}

export default function SettingsItem({
  icon,
  label,
  description,
  iconColor = COLORS.primary,
  onPress,
  showChevron = false,
  isLast = false,
  children,
}: SettingsItemProps) {
  const content = (
    <>
      <View style={styles.settingItemContent}>
        <View style={[styles.settingIconContainer, { backgroundColor: iconColor + "30" }]}>
          <Ionicons name={icon as any} size={20} color={iconColor} />
        </View>
        <View style={styles.settingTextContent}>
          <Text style={styles.settingLabel}>{label}</Text>
          {description && <Text style={styles.settingDescription}>{description}</Text>}
        </View>
      </View>
      {children ? children : showChevron && <Ionicons name="chevron-forward" size={20} color={COLORS.onSurfaceVariant} />}
    </>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onPress}
        style={[styles.settingItem, isLast && styles.settingItemLast]}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.settingItem, isLast && styles.settingItemLast]}>
      {content}
    </View>
  );
}
