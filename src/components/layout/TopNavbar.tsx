import { Ionicons } from "@expo/vector-icons";
import { Platform, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { COLORS } from "../../constants/colors";
import { topNavbarStyles as styles } from "./navbar.styles";

export default function TopNavbar() {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: Platform.OS === "ios" ? insets.top : 0,
          height: Platform.OS === "ios" ? 64 + insets.top : 64,
        },
      ]}
    >
      <View style={styles.leftGroup}>
        <Text style={styles.brand}>FreshFriends</Text>
      </View>

      <View style={styles.rightGroup}>
        <TouchableOpacity style={styles.iconButton} activeOpacity={0.7}>
          <Ionicons name="search-outline" size={24} color={COLORS.onSurface} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.iconButton} activeOpacity={0.7}>
          <Ionicons
            name="notifications-outline"
            size={24}
            color={COLORS.onSurface}
          />
          <View style={styles.dot} />
        </TouchableOpacity>
      </View>
    </View>
  );
}