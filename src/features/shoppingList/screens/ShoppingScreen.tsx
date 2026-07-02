import { useEffect, useMemo, useRef, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  Alert,
  Animated,
  PanResponder,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { COLORS } from "../../../constants/colors";
import TopNavbar from "../../../components/layout/TopNavbar";
import BottomNavbar from "../../../components/layout/BottomNavbar";
import ScreenContainer from "../../../components/layout/ScreenContainer";
import {
  addShoppingListItemApi,
  completeShoppingListApi,
  createShoppingListApi,
  deleteShoppingListItemApi,
  getShoppingListsApi,
  updateShoppingListItemApi,
} from "../services/shoppingApi";
import { shoppingScreenStyles as styles } from "../styles/ShoppingScreen.styles";
import { ShoppingList, ShoppingListItem } from "../types/shopping";

type SectionKey = "pending" | "purchased";

interface SectionConfig {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
}

const SECTIONS: Record<SectionKey, SectionConfig> = {
  pending: {
    title: "Cần mua",
    icon: "basket-outline",
    iconColor: COLORS.primary,
  },
  purchased: {
    title: "Đã mua",
    icon: "checkmark-done-outline",
    iconColor: COLORS.tertiary,
  },
};

function getErrorMessage(error: any) {
  return error?.response?.data?.message || error?.message || "Đã có lỗi xảy ra";
}

function formatItemSubtext(item: ShoppingListItem) {
  const quantity = `${item.quantity} ${item.unit}`.trim();
  const reason = item.reason === "LOW_STOCK" ? "Sắp hết hàng" : "Thêm thủ công";
  return `${quantity} • ${reason}`;
}

function parseQuantityInput(value: string) {
  return Number(value.trim().replace(",", "."));
}

interface ShoppingItemRowProps {
  item: ShoppingListItem;
  isLast: boolean;
  isSwiped: boolean;
  onCloseSwipe: () => void;
  onDelete: () => void;
  onEdit: () => void;
  onSwipeLeft: () => void;
  onToggle: () => void;
}

function ShoppingItemRow({
  item,
  isLast,
  isSwiped,
  onCloseSwipe,
  onDelete,
  onEdit,
  onSwipeLeft,
  onToggle,
}: ShoppingItemRowProps) {
  const translateX = useRef(new Animated.Value(isSwiped ? -82 : 0)).current;

  useEffect(() => {
    Animated.spring(translateX, {
      toValue: isSwiped ? -82 : 0,
      useNativeDriver: true,
      friction: 8,
      tension: 80,
    }).start();
  }, [isSwiped, translateX]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_event, gesture) =>
          Math.abs(gesture.dx) > 20 && Math.abs(gesture.dx) > Math.abs(gesture.dy),
        onPanResponderMove: (_event, gesture) => {
          const baseOffset = isSwiped ? -82 : 0;
          const nextValue = Math.max(-92, Math.min(0, baseOffset + gesture.dx));
          translateX.setValue(nextValue);
        },
        onPanResponderRelease: (_event, gesture) => {
          const baseOffset = isSwiped ? -82 : 0;
          const releasedOffset = baseOffset + gesture.dx;

          if (releasedOffset < -42) {
            onSwipeLeft();
            return;
          }

          onCloseSwipe();
        },
        onPanResponderTerminate: () => {
          Animated.spring(translateX, {
            toValue: isSwiped ? -82 : 0,
            useNativeDriver: true,
            friction: 8,
            tension: 80,
          }).start();
        },
      }),
    [isSwiped, onCloseSwipe, onSwipeLeft, translateX]
  );

  return (
    <View style={[styles.swipeRow, isLast && styles.itemRowLast]} {...panResponder.panHandlers}>
      <TouchableOpacity activeOpacity={0.85} style={styles.deleteAction} onPress={onDelete}>
        <Ionicons name="trash-outline" size={22} color={COLORS.onPrimary} />
        <Text style={styles.deleteActionText}>Xóa</Text>
      </TouchableOpacity>

      <Animated.View style={{ transform: [{ translateX }] }}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onToggle}
          onLongPress={onEdit}
          delayLongPress={350}
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
            <Text style={[styles.itemName, item.isPurchased && styles.itemNameChecked]}>
              {item.foodName}
            </Text>
            <Text style={styles.itemSubtext}>{formatItemSubtext(item)}</Text>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

export default function ShoppingScreen() {
  const insets = useSafeAreaInsets();
  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState<ShoppingListItem | null>(null);
  const [swipedItemId, setSwipedItemId] = useState<string | null>(null);
  const [form, setForm] = useState({
    foodName: "",
    quantity: "1",
    unit: "cái",
  });

  const activeList = lists[0];
  const items = activeList?.items ?? [];
  const hasItems = items.length > 0;
  const fabBottom = Platform.OS === "ios" ? 92 + insets.bottom : 92;

  const groupedItems = useMemo(
    () => ({
      pending: items.filter((item) => !item.isPurchased),
      purchased: items.filter((item) => item.isPurchased),
    }),
    [items]
  );

  const loadShoppingLists = async () => {
    setLoading(true);
    try {
      const data = await getShoppingListsApi("ACTIVE");
      setLists(data);
    } catch (error: any) {
      Alert.alert("Không tải được Shopping List", getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadShoppingLists();
  }, []);

  const ensureActiveList = async () => {
    if (activeList) return activeList;

    return createShoppingListApi({
      ownerType: "USER",
      listName: "Danh sách mua sắm",
      visibility: "PERSONAL",
    });
  };

  const resetForm = () => {
    setForm({ foodName: "", quantity: "1", unit: "cái" });
    setEditingItem(null);
    setShowAddForm(false);
  };

  const handleEditItem = (item: ShoppingListItem) => {
    setSwipedItemId(null);
    setEditingItem(item);
    setForm({
      foodName: item.foodName,
      quantity: String(item.quantity),
      unit: item.unit,
    });
    setShowAddForm(true);
  };

  const handleSubmitItem = async () => {
    const foodName = form.foodName.trim();
    const quantity = parseQuantityInput(form.quantity);
    const unit = form.unit.trim();

    if (!foodName) {
      Alert.alert("Thiếu tên món", "Vui lòng nhập tên thực phẩm cần mua.");
      return;
    }
    if (!Number.isFinite(quantity) || quantity <= 0) {
      Alert.alert("Số lượng không hợp lệ", "Vui lòng nhập số lớn hơn 0, ví dụ: 0.5 kg hoặc 500 gram.");
      return;
    }
    if (!unit) {
      Alert.alert("Thiếu đơn vị", "Vui lòng nhập đơn vị, ví dụ: cái, kg, bó.");
      return;
    }

    setSaving(true);
    try {
      const list = await ensureActiveList();

      if (editingItem) {
        await updateShoppingListItemApi(list._id, editingItem._id, {
          foodName,
          quantity,
          unit,
        });
      } else {
        await addShoppingListItemApi(list._id, {
          foodName,
          quantity,
          unit,
          reason: "USER_ADDED",
        });
      }

      resetForm();
      await loadShoppingLists();
    } catch (error: any) {
      Alert.alert(editingItem ? "Không sửa được món" : "Không thêm được món", getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteItem = (item: ShoppingListItem) => {
    if (!activeList) return;

    Alert.alert("Xóa nguyên liệu", `Xóa "${item.foodName}" khỏi Shopping List?`, [
      { text: "Hủy", style: "cancel", onPress: () => setSwipedItemId(null) },
      {
        text: "Xóa",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteShoppingListItemApi(activeList._id, item._id);
            setSwipedItemId(null);
            await loadShoppingLists();
          } catch (error: any) {
            Alert.alert("Không xóa được món", getErrorMessage(error));
          }
        },
      },
    ]);
  };

  const handleToggleItem = async (item: ShoppingListItem) => {
    if (!activeList) return;

    try {
      await updateShoppingListItemApi(activeList._id, item._id, {
        isPurchased: !item.isPurchased,
      });
      await loadShoppingLists();
    } catch (error: any) {
      Alert.alert("Không cập nhật được món", getErrorMessage(error));
    }
  };

  const handleCompleteList = () => {
    if (!activeList) {
      Alert.alert("Chưa có danh sách", "Hãy thêm món đầu tiên để tạo Shopping List.");
      return;
    }

    Alert.alert("Hoàn tất danh sách", "Đánh dấu shopping list này là đã hoàn tất?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Hoàn tất",
        onPress: async () => {
          try {
            await completeShoppingListApi(activeList._id);
            await loadShoppingLists();
          } catch (error: any) {
            Alert.alert("Không hoàn tất được", getErrorMessage(error));
          }
        },
      },
    ]);
  };

  const sectionKeys: SectionKey[] = ["pending", "purchased"];

  return (
    <ScreenContainer>
      <TopNavbar />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 100 }]}
        style={styles.container}
      >
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{activeList?.listName ?? "Shopping List"}</Text>
          <Text style={styles.subtitle}>
            Danh sách mua sắm được đồng bộ từ dữ liệu thật.
          </Text>
        </View>

        {hasItems && (
          <TouchableOpacity activeOpacity={0.9} style={styles.bannerButton} onPress={handleCompleteList}>
            <View style={styles.banner}>
              <View style={styles.bannerLeft}>
                <Ionicons name="checkmark-circle-outline" size={20} color={COLORS.onPrimary} />
                <Text style={styles.bannerText}>Hoàn tất danh sách mua sắm</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={COLORS.onPrimary} />
            </View>
          </TouchableOpacity>
        )}

        {showAddForm && (
          <View style={styles.addForm}>
            <Text style={styles.addFormTitle}>
              {editingItem ? "Sửa nguyên liệu" : "Thêm món cần mua"}
            </Text>
            <TextInput
              value={form.foodName}
              onChangeText={(value) => setForm((prev) => ({ ...prev, foodName: value }))}
              placeholder="VD: Cà chua bi"
              placeholderTextColor={COLORS.onSurfaceVariant}
              style={styles.input}
            />
            <View style={styles.formRow}>
              <TextInput
                value={form.quantity}
                onChangeText={(value) => setForm((prev) => ({ ...prev, quantity: value }))}
                keyboardType="decimal-pad"
                placeholder="Số lượng"
                placeholderTextColor={COLORS.onSurfaceVariant}
                style={[styles.input, styles.quantityInput]}
              />
              <TextInput
                value={form.unit}
                onChangeText={(value) => setForm((prev) => ({ ...prev, unit: value }))}
                placeholder="kg, gram..."
                placeholderTextColor={COLORS.onSurfaceVariant}
                style={[styles.input, styles.unitInput]}
              />
            </View>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleSubmitItem}
              disabled={saving}
              style={[styles.addButton, saving && styles.disabled]}
            >
              {saving ? (
                <ActivityIndicator color={COLORS.onPrimary} />
              ) : (
                <Text style={styles.addButtonText}>
                  {editingItem ? "Lưu thay đổi" : "Thêm vào danh sách"}
                </Text>
              )}
            </TouchableOpacity>
            {editingItem && (
              <TouchableOpacity activeOpacity={0.85} onPress={resetForm} style={styles.cancelEditButton}>
                <Text style={styles.cancelEditButtonText}>Hủy sửa</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {loading ? (
          <ActivityIndicator color={COLORS.primary} size="large" style={styles.loader} />
        ) : !hasItems && !showAddForm ? (
          <View style={styles.emptyAddContainer}>
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.emptyAddOnlyButton}
              onPress={() => setShowAddForm(true)}
            >
              <Ionicons name="add" size={20} color={COLORS.onPrimary} />
              <Text style={styles.emptyAddOnlyButtonText}>Thêm nguyên liệu</Text>
            </TouchableOpacity>
          </View>
        ) : hasItems ? (
          sectionKeys.map((sectionKey) => {
            const sectionItems = groupedItems[sectionKey];
            if (sectionItems.length === 0) return null;

            const config = SECTIONS[sectionKey];
            return (
              <View key={sectionKey} style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionHeaderLeft}>
                    <Ionicons name={config.icon} size={22} color={config.iconColor} />
                    <Text style={styles.sectionTitle}>{config.title}</Text>
                  </View>
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{sectionItems.length} items</Text>
                  </View>
                </View>

                <View style={styles.card}>
                  {sectionItems.map((item, idx) => {
                    const isLast = idx === sectionItems.length - 1;
                    return (
                      <ShoppingItemRow
                        key={item._id}
                        item={item}
                        isLast={isLast}
                        isSwiped={swipedItemId === item._id}
                        onCloseSwipe={() => setSwipedItemId(null)}
                        onDelete={() => handleDeleteItem(item)}
                        onEdit={() => handleEditItem(item)}
                        onSwipeLeft={() => setSwipedItemId(item._id)}
                        onToggle={() => handleToggleItem(item)}
                      />
                    );
                  })}
                </View>
              </View>
            );
          })
        ) : null}
      </ScrollView>

      {hasItems && (
        <TouchableOpacity
          activeOpacity={0.85}
          style={[styles.fab, { bottom: fabBottom }]}
          onPress={() => {
            if (showAddForm) {
              resetForm();
              return;
            }
            setShowAddForm(true);
          }}
        >
          <Ionicons name={showAddForm ? "close" : "add"} size={34} color={COLORS.onPrimary} />
        </TouchableOpacity>
      )}

      <BottomNavbar />
    </ScreenContainer>
  );
}
