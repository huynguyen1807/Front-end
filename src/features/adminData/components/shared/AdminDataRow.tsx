import { Ionicons } from "@expo/vector-icons";
import { Text, TouchableOpacity, View } from "react-native";

import { COLORS } from "../../../../constants/colors";
import { adminDataStyles as styles } from "../../styles/AdminData.styles";

type AdminDataRowProps = {
  title: string;
  subtitle?: string;
  onEdit: () => void;
  onDelete: () => void;
};

export default function AdminDataRow({
  title,
  subtitle,
  onEdit,
  onDelete,
}: AdminDataRowProps) {
  return (
    <View style={styles.dataRow}>
      <View style={styles.dataText}>
        <Text style={styles.dataTitle}>{title}</Text>
        {subtitle && <Text style={styles.dataSubtitle}>{subtitle}</Text>}
      </View>
      <TouchableOpacity style={styles.iconButton} activeOpacity={0.75} onPress={onEdit}>
        <Ionicons name="create-outline" size={19} color={COLORS.onSurfaceVariant} />
      </TouchableOpacity>
      <TouchableOpacity style={styles.iconButton} activeOpacity={0.75} onPress={onDelete}>
        <Ionicons name="trash-outline" size={19} color={COLORS.tertiary} />
      </TouchableOpacity>
    </View>
  );
}
