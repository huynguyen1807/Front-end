import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Platform, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { bottomNavbarStyles as styles } from "./navbar.styles";
import { useNavigation } from "app/providers/NavigationProvider";

const tabs = [
  { key: "home", label: "Trang chủ", icon: Ionicons, name: "home-outline" },
  { key: "scan", label: "Quét", icon: Ionicons, name: "scan-outline" },
  { key: "meal", label: "Kế hoạch", icon: MaterialCommunityIcons, name: "silverware-fork-knife" },
  { key: "shopping", label: "Mua sắm", icon: Ionicons, name: "basket-outline" },
  { key: "settings", label: "Cài đặt", icon: Ionicons, name: "menu-outline" },
];

export default function BottomNavbar() {
  const insets = useSafeAreaInsets();
  const { activeTab, setActiveTab } = useNavigation();

  return (
    <View
      style={[
        styles.container,
        {
          height: Platform.OS === "ios" ? 78 + insets.bottom : Platform.OS === "web" ? 76 : 78,
          paddingBottom: Platform.OS === "ios" ? insets.bottom : 0,
        },
        Platform.OS === "web" && styles.webContainer,
      ]}
    >
      {tabs.map((tab) => {
        const isActive = tab.key === activeTab;

        return (
          <TouchableOpacity
            key={tab.key}
            activeOpacity={0.8}
            onPress={() => setActiveTab(tab.key as any)}
            style={[
              styles.item,
              isActive && styles.activeItem,
              Platform.OS === "web" && styles.webItem,
              Platform.OS === "web" && isActive && styles.webActiveItem,
            ]}
          >
            <View
              style={
                Platform.OS === "web"
                  ? styles.webIcon
                  : isActive
                    ? styles.activeItem
                    : styles.item
              }
            >
              <tab.icon
                name={tab.name as never}
                size={Platform.OS === "web" ? 21 : 27}
                color={
                  Platform.OS === "web"
                    ? isActive
                      ? "var(--ff-primary)"
                      : "var(--ff-on-surface-variant)"
                    : undefined
                }
              />
            </View>
            {Platform.OS === "web" && (
              <Text style={[styles.webLabel, isActive && styles.webActiveLabel]}>
                {tab.label}
              </Text>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
