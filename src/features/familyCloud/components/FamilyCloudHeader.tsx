import { Ionicons } from "@expo/vector-icons";
import { Text, TouchableOpacity, View } from "react-native";

import { COLORS } from "../../../constants/colors";
import { reloadPageOrRefresh } from '../../../utils/reloadPage';
import { familyCloudStyles as styles } from "../styles/FamilyCloudScreen.styles";

interface FamilyCloudHeaderProps {
  onBack: () => void;
  onRefresh: () => void;
}

export default function FamilyCloudHeader({ onBack, onRefresh }: FamilyCloudHeaderProps) {
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={onBack} style={styles.iconButton}>
        <Ionicons name="arrow-back" size={22} color={COLORS.onSurface} />
      </TouchableOpacity>
      <Text style={styles.title}>Family Cloud</Text>
      <TouchableOpacity accessibilityRole="button" accessibilityLabel="Làm mới trang" onPress={() => reloadPageOrRefresh(onRefresh)} style={styles.iconButton}>
        <Ionicons name="refresh" size={20} color={COLORS.primary} />
      </TouchableOpacity>
    </View>
  );
}
