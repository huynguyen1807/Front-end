import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";

import { COLORS } from "../../../constants/colors";
import { familyCloudStyles as styles } from "../styles/FamilyCloudScreen.styles";

export default function FamilyCloudEmptyState() {
  return (
    <View style={styles.emptyBox}>
      <Ionicons name="people-outline" size={44} color={COLORS.primary} />
      <Text style={styles.emptyTitle}>Chưa có Family Cloud</Text>
      <Text style={styles.emptyText}>Tạo một nhóm gia đình để chia sẻ kho và shopping list.</Text>
    </View>
  );
}
