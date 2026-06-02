import { cloneElement } from "react";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Platform, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { COLORS } from "../../constants/colors";
import { setActiveTab, TabKey } from "../../redux/appSlice";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { bottomNavbarStyles as styles } from "./navbar.styles";
import { useNavigation } from "../../app/providers/NavigationProvider";

type NavVariant = "default" | "planner";

type TabConfig = {
  key: TabKey;
  label: string;
  icon: (color: string) => React.ReactNode;
};

const defaultTabs: TabConfig[] = [
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
    key: "settings",
    label: "Settings",
    icon: <Ionicons name="settings-outline" size={27} color="" />,
  },
];

type BottomNavbarProps = {
  variant?: NavVariant;
};

export default function BottomNavbar({ variant = "default" }: BottomNavbarProps) {
  const insets = useSafeAreaInsets();
  const { activeTab, setActiveTab } = useNavigation();

  return (
    <View
      style={[
        styles.container,
        isPlanner && styles.plannerContainer,
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
            onPress={() => setActiveTab(tab.key as any)}
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
