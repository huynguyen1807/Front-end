import { useCallback, useEffect, useMemo, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { COLORS } from "../../../constants/colors";
import TopNavbar from "../../../components/layout/TopNavbar";
import BottomNavbar from "../../../components/layout/BottomNavbar";
import ScreenContainer from "../../../components/layout/ScreenContainer";
import {
  getShoppingListsApi,
  updateShoppingListItemApi,
} from "../services/shoppingApi";
import { shoppingScreenStyles as styles } from "../styles/ShoppingScreen.styles";
import { ShoppingList, ShoppingListItem } from "../types/shopping";

type ShoppingGroup = {
  key: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  items: ShoppingListItem[];
};

const reasonLabels: Record<string, string> = {
  MISSING_INGREDIENT: "Cần mua thêm",
  LOW_STOCK: "Sắp hết trong kho",
  VIDEO_RECIPE: "Từ recipe video",
  USER_ADDED: "Tự thêm",
};

function getCategoryTitle(item: ShoppingListItem) {
  const category = item.categoryId;
  if (category && typeof category === "object" && category.categoryName) {
    return category.categoryName;
  }

  return reasonLabels[item.reason || ""] || "Cần mua";
}

function getGroupIcon(title: string): Pick<ShoppingGroup, "icon" | "iconColor"> {
  const normalized = title.toLowerCase();

  if (normalized.includes("rau") || normalized.includes("fruit") || normalized.includes("trái")) {
    return { icon: "leaf-outline", iconColor: COLORS.primary };
  }

  if (normalized.includes("thịt") || normalized.includes("meat") || normalized.includes("protein")) {
    return { icon: "restaurant-outline", iconColor: COLORS.tertiary };
  }

  if (normalized.includes("gia") || normalized.includes("spice")) {
    return { icon: "flask-outline", iconColor: "#a85c2c" };
  }

  return { icon: "basket-outline", iconColor: COLORS.primary };
}

function updateItemInLists(
  lists: ShoppingList[],
  listId: string,
  itemId: string,
  isPurchased: boolean
) {
  return lists.map((list) =>
    list._id === listId
      ? {
          ...list,
          items: list.items.map((item) =>
            item._id === itemId ? { ...item, isPurchased } : item
          ),
        }
      : list
  );
}

export default function ShoppingScreen() {
  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const loadShoppingLists = useCallback(async (silent = false) => {
    try {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setErrorMessage("");
      const data = await getShoppingListsApi();
      setLists(data);
    } catch (error: any) {
      setErrorMessage(
        error.response?.data?.message || error.message || "Không tải được shopping list."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadShoppingLists();
  }, [loadShoppingLists]);

  const activeList = lists[0];
  const items = activeList?.items || [];
  const remainingCount = items.filter((item) => !item.isPurchased).length;
  const purchasedCount = items.length - remainingCount;

  const groups = useMemo<ShoppingGroup[]>(() => {
    const grouped = new Map<string, ShoppingListItem[]>();

    items.forEach((item) => {
      const title = getCategoryTitle(item);
      grouped.set(title, [...(grouped.get(title) || []), item]);
    });

    return Array.from(grouped.entries()).map(([title, groupItems]) => {
      const icon = getGroupIcon(title);
      return {
        key: title,
        title,
        ...icon,
        items: groupItems,
      };
    });
  }, [items]);

  const toggleItem = async (item: ShoppingListItem) => {
    if (!activeList) return;

    const nextPurchased = !item.isPurchased;
    const previousLists = lists;
    setLists((current) =>
      updateItemInLists(current, activeList._id, item._id, nextPurchased)
    );

    try {
      const updated = await updateShoppingListItemApi(activeList._id, item._id, {
        isPurchased: nextPurchased,
      });
      setLists((current) =>
        current.map((list) => (list._id === updated._id ? updated : list))
      );
    } catch (error: any) {
      setLists(previousLists);
      setErrorMessage(
        error.response?.data?.message || error.message || "Không cập nhật được item."
      );
    }
  };

  return (
    <ScreenContainer>
      <TopNavbar />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => loadShoppingLists(true)} />
        }
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 100 }]}
        style={styles.container}
      >
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Shopping List</Text>
          <Text style={styles.subtitle}>
            Nguyên liệu cần mua để bổ sung lại inventory.
          </Text>
        </View>

        <View style={styles.bannerButton}>
          <View style={styles.banner}>
            <View style={styles.bannerLeft}>
              <Ionicons name="sparkles" size={20} color={COLORS.onPrimary} />
              <Text style={styles.bannerText}>
                {remainingCount} món cần mua từ meal plan và kho
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={COLORS.onPrimary} />
          </View>
        </View>

        <View style={styles.statRow}>
          <View style={styles.statPill}>
            <Text style={styles.statValue}>{remainingCount}</Text>
            <Text style={styles.statLabel}>Chưa mua</Text>
          </View>
          <View style={styles.statPill}>
            <Text style={styles.statValue}>{purchasedCount}</Text>
            <Text style={styles.statLabel}>Đã mua</Text>
          </View>
        </View>

        {errorMessage ? (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle-outline" size={18} color="#9c3b2c" />
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        {loading ? (
          <View style={styles.loadingBlock}>
            <ActivityIndicator color={COLORS.primary} />
            <Text style={styles.loadingText}>Đang tải shopping list...</Text>
          </View>
        ) : groups.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="basket-outline" size={30} color={COLORS.primary} />
            </View>
            <Text style={styles.emptyTitle}>Chưa có nguyên liệu cần mua</Text>
            <Text style={styles.emptyText}>
              Khi planner phát hiện thiếu nguyên liệu, bạn có thể thêm chúng vào đây.
            </Text>
          </View>
        ) : (
          groups.map((group) => {
            const remainingInGroup = group.items.filter((item) => !item.isPurchased).length;
            return (
              <View key={group.key} style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionHeaderLeft}>
                    <Ionicons name={group.icon} size={22} color={group.iconColor} />
                    <Text style={styles.sectionTitle}>{group.title}</Text>
                  </View>
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                      {remainingInGroup}/{group.items.length} cần mua
                    </Text>
                  </View>
                </View>

                <View style={styles.card}>
                  {group.items.map((item, idx) => {
                    const isLast = idx === group.items.length - 1;
                    return (
                      <TouchableOpacity
                        key={item._id}
                        activeOpacity={0.7}
                        onPress={() => toggleItem(item)}
                        style={[styles.itemRow, isLast && styles.itemRowLast]}
                      >
                        <View style={styles.checkbox}>
                          <Ionicons
                            name={item.isPurchased ? "checkbox" : "square-outline"}
                            size={24}
                            color={item.isPurchased ? COLORS.primary : COLORS.outlineVariant}
                          />
                        </View>
                        <View style={styles.itemContent}>
                          <Text
                            style={[
                              styles.itemName,
                              item.isPurchased && styles.itemNameChecked,
                            ]}
                          >
                            {item.foodName}
                          </Text>
                          <Text style={styles.itemSubtext}>
                            {item.quantity} {item.unit} •{" "}
                            {reasonLabels[item.reason || ""] || "Shopping list"}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      <TouchableOpacity
        activeOpacity={0.85}
        style={styles.fab}
        onPress={() => loadShoppingLists(true)}
      >
        <Ionicons name="refresh" size={27} color={COLORS.onPrimary} />
      </TouchableOpacity>

      <BottomNavbar />
    </ScreenContainer>
  );
}
