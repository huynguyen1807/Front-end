import { Ionicons } from "@expo/vector-icons";
import { Image, Platform, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { COLORS } from "../../constants/colors";
import { topNavbarStyles as styles } from "./navbar.styles";

type TopNavbarProps = {
  variant?: "default" | "planner";
};

export default function TopNavbar({ variant = "default" }: TopNavbarProps) {
  const insets = useSafeAreaInsets();
  const isPlanner = variant === "planner";

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
        {isPlanner && (
          <Image
            source={{
              uri: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&q=80",
            }}
            style={styles.avatar}
          />
        )}
        <Text style={[styles.brand, isPlanner && styles.plannerBrand]}>
          {isPlanner ? "FreshTrack" : "FreshFriends"}
        </Text>
      </View>

      <View style={styles.rightGroup}>
        {!isPlanner && (
          <TouchableOpacity style={styles.iconButton} activeOpacity={0.7}>
            <Ionicons name="search-outline" size={24} color={COLORS.onSurface} />
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.iconButton} activeOpacity={0.7}>
          <Ionicons
            name="notifications-outline"
            size={24}
            color={COLORS.onSurface}
          />
          {!isPlanner && <View style={styles.dot} />}
        </TouchableOpacity>
      </View>
    </View>
  );
}
