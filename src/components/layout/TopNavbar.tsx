import { useCallback, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Platform, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect, useNavigation } from "@react-navigation/native";

import { COLORS } from "../../constants/colors";
import { apiClient } from "../../services/apiClient";
import { topNavbarStyles as styles } from "./navbar.styles";
import WebThemeToggle from "./WebThemeToggle";

export default function TopNavbar() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const [unreadCount, setUnreadCount] = useState(0);

  // Cập nhật lại số thông báo chưa đọc mỗi khi quay lại màn hình (vd sau khi
  // đọc/xoá thông báo rồi back ra) để chuông luôn đúng với dữ liệu hiện tại.
  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      apiClient
        .get("/api/notifications")
        .then((response) => {
          if (!isActive || !response.data?.success) return;
          const unread = (response.data.data as Array<{ isRead: boolean }>).filter(
            (n) => !n.isRead
          ).length;
          setUnreadCount(unread);
        })
        .catch(() => {
          // Im lặng: badge chỉ là gợi ý, không chặn trải nghiệm chính khi lỗi mạng
        });
      return () => {
        isActive = false;
      };
    }, [])
  );

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

      <View style={[styles.rightGroup, Platform.OS === "web" && styles.webRightGroup]}>
        {Platform.OS === "web" && <WebThemeToggle compact />}
        <TouchableOpacity style={styles.iconButton} activeOpacity={0.7}>
          <Ionicons name="search-outline" size={24} color={COLORS.onSurface} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.iconButton}
          activeOpacity={0.7}
          onPress={() => navigation.navigate("Notifications")}
        >
          <Ionicons
            name="notifications-outline"
            size={24}
            color={COLORS.onSurface}
          />
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {unreadCount > 9 ? "9+" : unreadCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}