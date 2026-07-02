import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  Platform,
  Alert,
  Animated,
} from "react-native";
import { Swipeable } from "react-native-gesture-handler";
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

// ─── Swipeable row wrapper ──────────────────────────────────────────────────
interface SwipeableRowProps {
  children: React.ReactNode;
  onDelete: () => void;
}

function SwipeableRow({ children, onDelete }: SwipeableRowProps) {
  const swipeableRef = useRef<Swipeable>(null);

  const renderRightAction = (
    _progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>
  ) => {
    const scale = dragX.interpolate({
      inputRange: [-80, 0],
      outputRange: [1, 0.6],
      extrapolate: "clamp",
    });

    const handlePress = () => {
      swipeableRef.current?.close();
      onDelete();
    };

    return (
      <TouchableOpacity
        style={styles.deleteAction}
        onPress={handlePress}
        activeOpacity={0.85}
      >
        <Animated.View style={[styles.deleteActionInner, { transform: [{ scale }] }]}>
          <Ionicons name="trash" size={22} color="#fff" />
          <Text style={styles.deleteActionText}>Xoá</Text>
        </Animated.View>
      </TouchableOpacity>
    );
  };

  return (
    <Swipeable
      ref={swipeableRef}
      friction={2}
      overshootRight={false}
      rightThreshold={40}
      renderRightActions={renderRightAction}
      onSwipeableOpen={(direction) => {
        if (direction === "right") {
          // Người dùng vuốt hết → tự động xoá
          swipeableRef.current?.close();
          onDelete();
        }
      }}
    >
      {children}
    </Swipeable>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────
export default function NotificationScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

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

  // ─── Mark single as read ──────────────────────────────────────────────────
  const handleMarkAsRead = async (item: NotificationItem) => {
    if (item.isRead) return;
    try {
      setNotifications((prev) =>
        prev.map((n) => (n._id === item._id ? { ...n, isRead: true } : n))
      );
      await apiClient.patch(`/api/notifications/${item._id}/read`);
    } catch (error) {
      console.error("Error marking notification as read:", error);
      fetchNotifications(false);
    }
  };

  // ─── Mark all as read ─────────────────────────────────────────────────────
  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0) return;
    try {
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      await apiClient.patch("/api/notifications/read-all");
    } catch (error) {
      console.error("Error marking all as read:", error);
      fetchNotifications(false);
    }
  };

  // ─── Delete single (vuốt hoặc xoá tất cả) ────────────────────────────────
  const handleDelete = async (item: NotificationItem) => {
    try {
      setNotifications((prev) => prev.filter((n) => n._id !== item._id));
      await apiClient.delete(`/api/notifications/${item._id}`);
    } catch (error) {
      console.error("Error deleting notification:", error);
      fetchNotifications(false);
    }
  };

  // ─── Delete all ───────────────────────────────────────────────────────────
  const handleDeleteAll = () => {
    if (notifications.length === 0) return;
    Alert.alert("Xoá tất cả", "Bạn có chắc muốn xoá toàn bộ thông báo?", [
      { text: "Huỷ", style: "cancel" },
      {
        text: "Xoá",
        style: "destructive",
        onPress: async () => {
          try {
            setNotifications([]);
            await apiClient.delete("/api/notifications");
          } catch (error) {
            console.error("Error deleting all:", error);
            fetchNotifications(false);
          }
        },
      },
    ]);
  };

  // ─── Icon theo loại ──────────────────────────────────────────────────────
  const renderIcon = (item: NotificationItem) => {
    let iconName: keyof typeof Ionicons.glyphMap = "notifications-outline";
    let iconColor = COLORS.primary;

    if (item.type === "EXPIRY_ALERT") {
      if (item.priority === "HIGH") {
        iconName = "alert-circle-outline";
        iconColor = COLORS.tertiary;
      } else {
        iconName = "warning-outline";
        iconColor = COLORS.secondary;
      }
    } else if (item.type === "STORAGE_WARNING") {
      iconName = "thermometer-outline";
      iconColor = "#F59E0B";
    }

    return (
      <View style={[styles.iconWrapper, { backgroundColor: iconColor + "18" }]}>
        <Ionicons name={iconName} size={24} color={iconColor} />
      </View>
    );
  };

  // ─── Render card ─────────────────────────────────────────────────────────
  const renderItem = ({ item }: { item: NotificationItem }) => {
    const formattedDate = new Date(item.createdAt).toLocaleDateString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

    return (
      <SwipeableRow onDelete={() => handleDelete(item)}>
        <TouchableOpacity
          activeOpacity={0.8}
          style={[styles.card, !item.isRead && styles.unreadCard]}
          onPress={() => handleMarkAsRead(item)}
        >
          {renderIcon(item)}
          <View style={styles.cardContent}>
            <View style={styles.cardHeader}>
              <Text
                style={[styles.title, !item.isRead && styles.unreadText]}
                numberOfLines={1}
              >
                {item.title}
              </Text>
              {!item.isRead && <View style={styles.unreadDot} />}
            </View>
            <Text style={styles.message}>{item.message}</Text>
            <Text style={styles.date}>{formattedDate}</Text>
          </View>
        </TouchableOpacity>
      </SwipeableRow>
    );
  };

  return (
    <ScreenContainer>
      {/* Header */}
      <View
        style={[
          styles.header,
          { paddingTop: Platform.OS === "ios" ? insets.top : 12 },
        ]}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.onSurface} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Thông báo</Text>
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>

        <View style={styles.headerActions}>
          {unreadCount > 0 && (
            <TouchableOpacity onPress={handleMarkAllAsRead} style={styles.headerBtn}>
              <Ionicons name="checkmark-done-outline" size={22} color={COLORS.primary} />
            </TouchableOpacity>
          )}
          {notifications.length > 0 && (
            <TouchableOpacity onPress={handleDeleteAll} style={styles.headerBtn}>
              <Ionicons name="trash-outline" size={20} color={COLORS.onSurfaceVariant} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.centered}>
          <Ionicons
            name="notifications-off-outline"
            size={64}
            color={COLORS.outlineVariant}
          />
          <Text style={styles.emptyTitle}>Không có thông báo nào</Text>
          <Text style={styles.emptySubtitle}>
            Vuốt sang trái để xoá từng thông báo.{"\n"}Các cảnh báo hết hạn và
            bảo quản sẽ xuất hiện tại đây.
          </Text>
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
    paddingHorizontal: 12,
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
  headerCenter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.onSurface,
  },
  badge: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 5,
  },
  badgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    width: 80,
    justifyContent: "flex-end",
  },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
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
  // ─── Card ─────────────────────────────────────────────────────────────────
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
    flexShrink: 0,
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
    flexShrink: 0,
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
  // ─── Swipe delete action ──────────────────────────────────────────────────
  deleteAction: {
    backgroundColor: "#EF4444",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    width: 80,
    marginLeft: 8,
  },
  deleteActionInner: {
    alignItems: "center",
    gap: 4,
  },
  deleteActionText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  // ─── Empty state ──────────────────────────────────────────────────────────
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
    lineHeight: 20,
  },
});
