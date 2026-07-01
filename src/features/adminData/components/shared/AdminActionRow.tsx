import { MaterialCommunityIcons } from "@expo/vector-icons";
import { View } from "react-native";

import { adminDataStyles as styles } from "../../styles/AdminData.styles";
import AdminActionButton from "./AdminActionButton";

type AdminActionRowProps = {
  primaryLabel: string;
  primaryIcon: keyof typeof MaterialCommunityIcons.glyphMap;
  onPrimary: () => void;
  disabled?: boolean;
  onCancel?: () => void;
};

export default function AdminActionRow({
  primaryLabel,
  primaryIcon,
  onPrimary,
  disabled,
  onCancel,
}: AdminActionRowProps) {
  return (
    <View style={styles.actionRow}>
      <AdminActionButton
        label={primaryLabel}
        icon={primaryIcon}
        onPress={onPrimary}
        disabled={disabled}
      />
      {onCancel && (
        <AdminActionButton label="Hủy" icon="close" secondary onPress={onCancel} />
      )}
    </View>
  );
}
