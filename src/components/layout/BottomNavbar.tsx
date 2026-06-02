import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Platform, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { COLORS } from "../../constants/colors";
import { setActiveTab, TabKey } from "../../redux/appSlice";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { bottomNavbarStyles as styles } from "./navbar.styles";

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
    icon: (color) => <Ionicons name="home-outline" size={27} color={color} />,
  },
  {
    key: "scan",
    label: "Scan",
    icon: (color) => <Ionicons name="scan-outline" size={27} color={color} />,
  },
  {
    key: "meal",
    label: "Meal",
    icon: (color) => (
      <MaterialCommunityIcons
        name="silverware-fork-knife"
        size={27}
        color={color}
      />
    ),
  },
  {
    key: "shopping",
    label: "Shopping",
    icon: (color) => <Ionicons name="basket-outline" size={27} color={color} />,
  },
  {
    key: "menu",
    label: "Menu",
    icon: (color) => <Ionicons name="menu-outline" size={29} color={color} />,
  },
];

const plannerTabs: TabConfig[] = [
  {
    key: "home",
    label: "Dashboard",
    icon: (color) => <Ionicons name="grid-outline" size={24} color={color} />,
  },
  {
    key: "scan",
    label: "Scanner",
    icon: (color) => <Ionicons name="camera-outline" size={24} color={color} />,
  },
  {
    key: "meal",
    label: "Planner",
    icon: (color) => (
      <MaterialCommunityIcons name="calendar-month" size={24} color={color} />
    ),
  },
  {
    key: "shopping",
    label: "Shopping",
    icon: (color) => <Ionicons name="basket-outline" size={24} color={color} />,
  },
];

type BottomNavbarProps = {
  variant?: NavVariant;
};

export default function BottomNavbar({ variant = "default" }: BottomNavbarProps) {
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const activeTab = useAppSelector((state) => state.app.activeTab);
  const isPlanner = variant === "planner";
  const tabs = isPlanner ? plannerTabs : defaultTabs;

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
            onPress={() => dispatch(setActiveTab(tab.key))}
            style={[
              styles.item,
              isActive && styles.activeItem,
              isPlanner && styles.plannerItem,
              isPlanner && isActive && styles.plannerActiveItem,
            ]}
          >
            <View style={styles.icon}>{tab.icon(iconColor)}</View>

            <Text style={[styles.label, isActive && styles.activeLabel]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
