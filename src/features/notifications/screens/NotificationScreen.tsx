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
  type StyleProp,
  type ViewStyle,
} from "react-native";
import Swipeable, { type SwipeableMethods } from "react-native-gesture-handler/ReanimatedSwipeable";
// Dùng TouchableOpacity của gesture-handler (không phải của react-native) cho nội dung
// bên trong Swipeable: nó chia sẻ cùng "gesture arena" với Swipeable nên khi người dùng
// vuốt, việc nhận gesture vuốt sẽ huỷ press — tránh vừa vuốt vừa bị tính là bấm mở nội dung.
import { TouchableOpacity as GestureTouchableOpacity } from "react-native-gesture-handler";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  type SharedValue,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";

import ScreenContainer from "../../../components/layout/ScreenContainer";
import { COLORS } from "../../../constants/colors";
import { reloadPageOrRefresh } from '../../../utils/reloadPage';
import { apiClient } from "../../../services/apiClient";
import { getFoodByIdApi } from "../../inventory/services/foodApi";

interface NotificationItem {
  _id: string;
  title: string;
  message: string;
  type: string;
  priority: "LOW" | "MEDIUM" | "HIGH";
  isRead: boolean;
  createdAt: string;
  foodItemId?: string;
}

// ─── Nhãn module để người dùng biết thông báo thuộc phần nào ────────────────
const TYPE_META: Record<string, { label: string; icon: keyof typeof Ionicons.glyphMap; color: string }> = {
  EXPIRY_ALERT: { label: "Hạn sử dụng", icon: "time-outline", color: COLORS.tertiary },
  STORAGE_WARNING: { label: "Bảo quản / Kho", icon: "thermometer-outline", color: "#F59E0B" },
  MEAL_REMINDER: { label: "Kế hoạch bữa ăn", icon: "restaurant-outline", color: COLORS.primary },
  FAMILY_SYNC: { label: "Gia đình", icon: "people-outline", color: COLORS.primary },
  PAYMENT_RESULT: { label: "Thanh toán", icon: "card-outline", color: COLORS.primary },
  SUPPORT_UPDATE: { label: "Hỗ trợ", icon: "help-buoy-outline", color: COLORS.primary },
};

function getTypeMeta(type: string) {
  return TYPE_META[type] ?? { label: "Thông báo", icon: "notifications-outline" as const, color: COLORS.primary };
}

// ─── Swipeable row wrapper ──────────────────────────────────────────────────
// Hành vi mong muốn:
//  - Mặc định nút xoá ẨN, chỉ hiện khi người dùng VUỐT sang trái.
//  - Nhấp (không vuốt) khi hàng đang ĐÓNG → chỉ mở nội dung thông báo.
//  - Nhấp vào hàng khi đang MỞ (do vừa vuốt) → chỉ đóng lại, KHÔNG mở nội dung.
//  - Chỉ xoá khi người dùng bấm thẳng vào nút "Xoá" màu đỏ.
interface SwipeableRowProps {
  children: React.ReactNode;
  cardStyle?: StyleProp<ViewStyle>;
  disabled?: boolean;
  onPressContent: () => void;
  onDelete: () => void;
}

function NotificationDeleteAction({
  translation,
  onPress,
}: {
  translation: SharedValue<number>;
  onPress: () => void;
}) {
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scale: interpolate(translation.value, [-80, 0], [1, 0.6], Extrapolation.CLAMP),
      },
    ],
  }));

  return (
    <GestureTouchableOpacity
      style={styles.deleteAction}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <Animated.View style={[styles.deleteActionInner, animatedStyle]}>
        <Ionicons name="trash" size={22} color="#fff" />
        <Text style={styles.deleteActionText}>Xoá</Text>
      </Animated.View>
    </GestureTouchableOpacity>
  );
}

function SwipeableRow({ children, cardStyle, disabled, onPressContent, onDelete }: SwipeableRowProps) {
  const swipeableRef = useRef<SwipeableMethods>(null);
  const isOpenRef = useRef(false);

  const handleDeleteButtonPress = () => {
    swipeableRef.current?.close();
    onDelete();
  };

  const handleCardPress = () => {
    if (isOpenRef.current) {
      // Hàng đang mở do vừa vuốt → nhấp vào chỉ để đóng lại, không mở nội dung.
      swipeableRef.current?.close();
      return;
    }
    onPressContent();
  };

  return (
    <Swipeable
      ref={swipeableRef}
      friction={2}
      overshootRight={false}
      rightThreshold={40}
      dragOffsetFromRight={-20}
      renderRightActions={(_progress, translation) => (
        <NotificationDeleteAction translation={translation} onPress={handleDeleteButtonPress} />
      )}
      onSwipeableWillOpen={() => {
        isOpenRef.current = true;
      }}
      onSwipeableWillClose={() => {
        isOpenRef.current = false;
      }}
    >
      <GestureTouchableOpacity
        activeOpacity={0.8}
        disabled={disabled}
        style={cardStyle}
        onPress={handleCardPress}
      >
        {children}
      </GestureTouchableOpacity>
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

  // ─── Mở thông báo: đánh dấu đã đọc + điều hướng tới phần liên quan ───────
  const [openingId, setOpeningId] = useState<string | null>(null);
  const handleOpenNotification = async (item: NotificationItem) => {
    handleMarkAsRead(item);

    if (!item.foodItemId) return; // SUPPORT_UPDATE và các loại khác chưa có màn chi tiết riêng

    setOpeningId(item._id);
    try {
      const food = await getFoodByIdApi(item.foodItemId);
      (navigation as any).navigate("FoodDetail", { item: food });
    } catch (error) {
      console.error("Error opening food from notification:", error);
      Alert.alert(
        "Không mở được",
        "Thực phẩm liên quan đến thông báo này không còn tồn tại hoặc đã bị xoá."
      );
    } finally {
      setOpeningId(null);
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

  // ─── Xoá tất cả thông báo ĐÃ ĐỌC (nút thùng rác ở header) ────────────────
  const readCount = notifications.filter((n) => n.isRead).length;
  const handleDeleteAllRead = () => {
    if (readCount === 0) return;
    Alert.alert(
      "Xoá thông báo đã đọc",
      `Bạn có chắc muốn xoá ${readCount} thông báo đã đọc? Thông báo chưa đọc sẽ được giữ lại.`,
      [
        { text: "Huỷ", style: "cancel" },
        {
          text: "Xoá",
          style: "destructive",
          onPress: async () => {
            try {
              setNotifications((prev) => prev.filter((n) => !n.isRead));
              await apiClient.delete("/api/notifications/read");
            } catch (error) {
              console.error("Error deleting read notifications:", error);
              fetchNotifications(false);
            }
          },
        },
      ]
    );
  };

  // ─── Icon theo loại ──────────────────────────────────────────────────────
  const renderIcon = (item: NotificationItem) => {
    const meta = getTypeMeta(item.type);
    let iconName = meta.icon;
    let iconColor = meta.color;

    if (item.type === "EXPIRY_ALERT" && item.priority !== "HIGH") {
      iconName = "warning-outline";
      iconColor = COLORS.secondary;
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
    const meta = getTypeMeta(item.type);

    return (
      <SwipeableRow
        cardStyle={[styles.card, !item.isRead && styles.unreadCard]}
        disabled={openingId === item._id}
        onPressContent={() => handleOpenNotification(item)}
        onDelete={() => handleDelete(item)}
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
          <View style={styles.typeBadge}>
            <Text style={[styles.typeBadgeText, { color: meta.color }]}>{meta.label}</Text>
            {item.foodItemId && (
              <Ionicons name="chevron-forward" size={12} color={meta.color} style={{ marginLeft: 2 }} />
            )}
          </View>
          <Text style={styles.message}>{item.message}</Text>
          <Text style={styles.date}>{formattedDate}</Text>
        </View>
        {openingId === item._id && (
          <ActivityIndicator size="small" color={COLORS.primary} style={{ marginLeft: 8 }} />
        )}
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
          {readCount > 0 && (
            <TouchableOpacity onPress={handleDeleteAllRead} style={styles.headerBtn}>
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
              onRefresh={() => reloadPageOrRefresh(handleRefresh)}
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
    borderColor: COLORS.alpha(COLORS.primary, "30"),
    backgroundColor: COLORS.alpha(COLORS.primary, "04"),
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
  typeBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
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
