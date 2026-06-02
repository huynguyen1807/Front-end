import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Platform, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { bottomNavbarStyles as styles } from "./navbar.styles";
import { useNavigation } from "app/providers/NavigationProvider";

const tabs = [
  { key: "home", icon: <Ionicons name="home-outline" size={27} /> },
  { key: "scan", icon: <Ionicons name="scan-outline" size={27} /> },
  { key: "meal", icon: <MaterialCommunityIcons name="silverware-fork-knife" size={27} /> },
  { key: "shopping", icon: <Ionicons name="basket-outline" size={27} /> },
  { key: "settings", icon: <Ionicons name="menu-outline" size={27} /> },
];

export default function BottomNavbar() {
  const insets = useSafeAreaInsets();
  const { activeTab, setActiveTab } = useNavigation();

  return (
    <View
      style={[
        styles.container,
        {
          height: Platform.OS === "ios" ? 78 + insets.bottom : 78,
          paddingBottom: Platform.OS === "ios" ? insets.bottom : 0,
        },
      ]}
    >
      {tabs.map((tab) => {
        const isActive = tab.key === activeTab;

        return (
          <TouchableOpacity
            key={tab.key}
            activeOpacity={0.8}
            onPress={() => setActiveTab(tab.key as any)}
            style={[styles.item, isActive && styles.activeItem]}
          >
            <View style={isActive ? styles.activeItem : styles.item}>
              {tab.icon}
            </View>

          </TouchableOpacity>
        );
      })}
    </View>
  );
}
