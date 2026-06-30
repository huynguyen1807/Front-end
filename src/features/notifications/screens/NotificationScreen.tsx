import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";

import ScreenContainer from "../../../components/layout/ScreenContainer";
import { COLORS } from "../../../constants/colors";
import { apiClient } from "../../../services/apiClient";

interface NotificationItem {
  _id: string;
  title: string;
  message: string;
  type: string;
  priority: "LOW" | "MEDIUM" | "HIGH";
  isRead: boolean;
  createdAt: string;
}

export default function NotificationScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = useCallback(async (showIndicator = true) => {
    if (showIndicator) setLoading(true);
    try {
      const response = await apiClient.get("/api/notifications");
      if (response.data?.success) {
        setNotifications(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchNotifications(false);
  };

  const handleMarkAsRead = async (item: NotificationItem) => {
    if (item.isRead) return;
    try {
      // Optimistic update
      setNotifications((prev) =>
        prev.map((n) => (n._id === item._id ? { ...n, isRead: true } : n))
      );
      await apiClient.patch(`/api/notifications/${item._id}/read`);
    } catch (error) {
      console.error("Error marking notification as read:", error);
      // Rollback
      fetchNotifications(false);
    }
  };

  const renderIcon = (item: NotificationItem) => {
    let iconName: keyof typeof Ionicons.glyphMap = "notifications-outline";
    let iconColor = COLORS.primary;

    if (item.type === "EXPIRY_ALERT") {
      if (item.priority === "HIGH") {
        iconName = "alert-circle-outline";
        iconColor = COLORS.tertiary; // Red for expired
      } else {
        iconName = "warning-outline";
        iconColor = COLORS.secondary; // Orange/Yellow for near expiry
      }
    }

    return (
      <View style={[styles.iconWrapper, { backgroundColor: iconColor + "15" }]}>
        <Ionicons name={iconName} size={24} color={iconColor} />
      </View>
    );
  };

  const renderItem = ({ item }: { item: NotificationItem }) => {
    const formattedDate = new Date(item.createdAt).toLocaleDateString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        style={[
          styles.card,
          !item.isRead && styles.unreadCard,
        ]}
        onPress={() => handleMarkAsRead(item)}
      >
        {renderIcon(item)}
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <Text style={[styles.title, !item.isRead && styles.unreadText]}>
              {item.title}
            </Text>
            {!item.isRead && <View style={styles.unreadDot} />}
          </View>
          <Text style={styles.message}>{item.message}</Text>
          <Text style={styles.date}>{formattedDate}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ScreenContainer>
      {/* Header bar */}
      <View style={[styles.header, { paddingTop: Platform.OS === "ios" ? insets.top : 12 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thông báo</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Content list */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.centered}>
          <Ionicons name="notifications-off-outline" size={64} color={COLORS.outlineVariant} />
          <Text style={styles.emptyTitle}>Không có thông báo nào</Text>
          <Text style={styles.emptySubtitle}>Các thông báo cảnh báo hết hạn sẽ được hiển thị tại đây.</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[COLORS.primary]}
              tintColor={COLORS.primary}
            />
          }
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceContainer,
    backgroundColor: COLORS.surfaceContainerLowest,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.onSurface,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  listContainer: {
    padding: 16,
    gap: 12,
  },
  card: {
    flexDirection: "row",
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(189,202,191,0.2)",
    shadowColor: "#000",
    shadowOpacity: 0.02,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  unreadCard: {
    borderColor: COLORS.primary + "30",
    backgroundColor: COLORS.primary + "04",
  },
  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  cardContent: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  title: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.onSurface,
    flex: 1,
  },
  unreadText: {
    fontWeight: "700",
    color: COLORS.primary,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    marginLeft: 8,
  },
  message: {
    fontSize: 13,
    color: COLORS.onSurfaceVariant,
    lineHeight: 18,
    marginBottom: 8,
  },
  date: {
    fontSize: 11,
    color: COLORS.onSurfaceVariant,
    opacity: 0.7,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.onSurface,
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.onSurfaceVariant,
    textAlign: "center",
    marginTop: 8,
  },
});
