import { Ionicons } from "@expo/vector-icons";
import { Image, Platform, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { COLORS } from "../../constants/colors";
import { topNavbarStyles as styles } from "./navbar.styles";
import { useNavigation } from "../../app/providers/NavigationProvider";

type TopNavbarProps = {
  variant?: "default" | "planner";
};

export default function TopNavbar({ variant = "default" }: TopNavbarProps) {
  const insets = useSafeAreaInsets();
  const { activeTab, setActiveTab } = useNavigation();

  const isSettingsScreen = activeTab === "settings";

  return (
    <View
      style={[
        styles.container,
        isPlanner && styles.plannerContainer,
        {
          paddingTop: Platform.OS === "ios" ? insets.top : 0,
          height: Platform.OS === "ios" ? 64 + insets.top : 64,
        },
      ]}
    >
      <View style={styles.leftGroup}>
        {isSettingsScreen ? (
          <>
            <TouchableOpacity
              onPress={() => setActiveTab("home")}
              activeOpacity={0.7}
              style={styles.iconButton}
            >
              <Ionicons name="arrow-back" size={24} color={COLORS.onSurface} />
            </TouchableOpacity>
            <Text style={[styles.brand, { fontSize: 18 }]}>Cài đặt</Text>
          </>
        ) : (
          <Text style={styles.brand}>FreshFriends</Text>
        )}
      </View>

      {!isSettingsScreen && (
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
      )}
    </View>
  );
}
