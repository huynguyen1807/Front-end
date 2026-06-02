import { cloneElement } from "react";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Platform, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { COLORS } from "../../constants/colors";
import { bottomNavbarStyles as styles } from "./navbar.styles";

const tabs = [
  {
    key: "home",
    label: "Home",
    icon: <Ionicons name="home-outline" size={27} color="" />,
  },
  {
    key: "scan",
    label: "Scan",
    icon: <Ionicons name="scan-outline" size={27} color="" />,
  },
  {
    key: "meal",
    label: "Meal",
    icon: <MaterialCommunityIcons name="silverware-fork-knife" size={27} color="" />,
  },
  {
    key: "shopping",
    label: "Shopping",
    icon: <Ionicons name="basket-outline" size={27} color="" />,
  },
  {
    key: "menu",
    label: "Menu",
    icon: <Ionicons name="menu-outline" size={29} color="" />,
  },
];

export default function BottomNavbar() {
  const insets = useSafeAreaInsets();
  const activeTab = "home";

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
        const iconColor = isActive
          ? COLORS.onSecondaryContainer
          : COLORS.onSurfaceVariant;

        return (
          <TouchableOpacity
            key={tab.key}
            activeOpacity={0.8}
            style={[styles.item, isActive && styles.activeItem]}
          >
            <View>
              {cloneElement(tab.icon, { color: iconColor })}
            </View>

            <Text style={[styles.label, isActive && styles.activeLabel]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}