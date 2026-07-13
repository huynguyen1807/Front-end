import { useEffect, useMemo, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  StyleSheet,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import BottomNavbar from "../../../components/layout/BottomNavbar";
import ScreenContainer from "../../../components/layout/ScreenContainer";
import TopNavbar from "../../../components/layout/TopNavbar";
import { COLORS } from "../../../constants/colors";
import { getMyHouseholdsApi } from "../../familyCloud/services/familyCloudApi";
import NearbyStoresSection from "../components/NearbyStoresSection";
import {
  addShoppingListItemApi,
  completeShoppingListApi,
  createShoppingListApi,
  deleteShoppingListItemApi,
  getShoppingListsApi,
  updateShoppingListItemApi,
} from "../services/shoppingApi";
import { shoppingScreenStyles as baseStyles } from "../styles/ShoppingScreen.styles";
import { ShoppingList, ShoppingListItem } from "../types/shopping";

type SectionKey = "pending" | "purchased";

const MAX_FOOD_NAME_LENGTH = 80;
const MAX_UNIT_LENGTH = 20;
const MAX_QUANTITY = 100000;
const QUANTITY_PATTERN = /^\d+([.,]\d{1,3})?$/;
const UNIT_PATTERN = /^[\p{L}\d\s./-]+$/u;

const SECTIONS: Record<
  SectionKey,
  { title: string; icon: keyof typeof Ionicons.glyphMap; iconColor: string }
> = {
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

function validateShoppingItemForm(foodName: string, quantityText: string, quantity: number, unit: string) {
  if (!foodName) {
    return "Vui lòng nhập tên thực phẩm cần mua.";
  }
  if (foodName.length > MAX_FOOD_NAME_LENGTH) {
    return `Tên thực phẩm không được vượt quá ${MAX_FOOD_NAME_LENGTH} ký tự.`;
  }
  if (!quantityText.trim()) {
    return "Vui lòng nhập số lượng.";
  }
  if (!QUANTITY_PATTERN.test(quantityText.trim())) {
    return "Số lượng chỉ được nhập số, tối đa 3 chữ số thập phân. Ví dụ: 0.5 hoặc 500.";
  }
  if (!Number.isFinite(quantity) || quantity <= 0) {
    return "Vui lòng nhập số lớn hơn 0, ví dụ: 0.5 kg hoặc 500 gram.";
  }
  if (quantity > MAX_QUANTITY) {
    return `Số lượng không được vượt quá ${MAX_QUANTITY}.`;
  }
  if (!unit) {
    return "Vui lòng nhập đơn vị, ví dụ: cái, kg, bó.";
  }
  if (unit.length > MAX_UNIT_LENGTH) {
    return `Đơn vị không được vượt quá ${MAX_UNIT_LENGTH} ký tự.`;
  }
  if (!UNIT_PATTERN.test(unit)) {
    return "Đơn vị chỉ nên gồm chữ, số, khoảng trắng hoặc các ký tự ./-";
  }

  return null;
}

interface ShoppingItemRowProps {
  item: ShoppingListItem;
  isLast: boolean;
  showDeleteAction: boolean;
  onDelete: () => void;
  onEdit: () => void;
  onShowDeleteAction: () => void;
  onToggle: () => void;
}

function ShoppingItemRow({
  item,
  isLast,
  showDeleteAction,
  onDelete,
  onEdit,
  onShowDeleteAction,
  onToggle,
}: ShoppingItemRowProps) {
  return (
    <View style={[styles.itemWrapper, isLast && styles.itemRowLast]}>
      <TouchableOpacity
        activeOpacity={0.95}
        onLongPress={onShowDeleteAction}
        delayLongPress={350}
        style={[styles.itemRow, isLast && styles.itemRowLast]}
      >
        <TouchableOpacity
          activeOpacity={0.75}
          onPress={onToggle}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={styles.checkbox}
        >
          <Ionicons
            name={item.isPurchased ? "checkbox" : "square-outline"}
            size={24}
            color={item.isPurchased ? COLORS.primary : COLORS.outlineVariant}
          />
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.75}
          onPress={onEdit}
          onLongPress={onShowDeleteAction}
          delayLongPress={350}
          style={styles.itemContent}
        >
          <Text style={[styles.itemName, item.isPurchased && styles.itemNameChecked]}>
            {item.foodName}
          </Text>
          <Text style={styles.itemSubtext}>{formatItemSubtext(item)}</Text>
        </TouchableOpacity>
      </TouchableOpacity>

      {showDeleteAction && (
        <TouchableOpacity activeOpacity={0.85} style={styles.inlineDeleteAction} onPress={onDelete}>
          <Ionicons name="trash-outline" size={18} color={COLORS.onPrimary} />
          <Text style={styles.deleteActionText}>Xóa nguyên liệu</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function ShoppingScreen() {
  const insets = useSafeAreaInsets();
  const [viewMode, setViewMode] = useState<"ACTIVE" | "HISTORY">("ACTIVE");
  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [historyLists, setHistoryLists] = useState<ShoppingList[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState<ShoppingListItem | null>(null);
  const [deleteActionItemId, setDeleteActionItemId] = useState<string | null>(null);
  const [familyHouseholdId, setFamilyHouseholdId] = useState<string>("");
  const [form, setForm] = useState({
    foodName: "",
    quantity: "1",
    unit: "cái",
  });

  const familySharedList = lists.find((list) => {
      const householdId =
        typeof list.householdId === "string" ? list.householdId : list.householdId?._id;
      return familyHouseholdId && list.ownerType === "HOUSEHOLD" && householdId === familyHouseholdId;
    });
  const activeList = familySharedList ?? lists[0];
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
      if (viewMode === "ACTIVE") {
        const data = await getShoppingListsApi("ACTIVE");
        setLists(data);
      } else {
        const data = await getShoppingListsApi("COMPLETED");
        setHistoryLists(data);
      }
    } catch (error: any) {
      Alert.alert("Không tải được Shopping List", getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadShoppingLists();
  }, [viewMode]);

  useEffect(() => {
    const loadFamilyContext = async () => {
      try {
        const households = await getMyHouseholdsApi();
        setFamilyHouseholdId(households[0]?.household._id ?? "");
      } catch {
        setFamilyHouseholdId("");
      }
    };

    loadFamilyContext();
  }, []);

  const ensureActiveList = async () => {
    if (familyHouseholdId) {
      if (familySharedList) return familySharedList;

      return createShoppingListApi({
        ownerType: "HOUSEHOLD",
        householdId: familyHouseholdId,
        listName: "Danh sách mua sắm gia đình",
        visibility: "SHARED",
      });
    }

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
    setDeleteActionItemId(null);
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
    const quantityText = form.quantity.trim();
    const quantity = parseQuantityInput(form.quantity);
    const unit = form.unit.trim();
    const validationError = validateShoppingItemForm(foodName, quantityText, quantity, unit);

    if (validationError) {
      Alert.alert("Thông tin chưa hợp lệ", validationError);
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

  const handleToggleItem = async (item: ShoppingListItem) => {
    if (!activeList) return;

    try {
      await updateShoppingListItemApi(activeList._id, item._id, {
        isPurchased: !item.isPurchased,
      });
      setDeleteActionItemId(null);
      await loadShoppingLists();
    } catch (error: any) {
      Alert.alert("Không cập nhật được món", getErrorMessage(error));
    }
  };

  const handleDeleteItem = (item: ShoppingListItem) => {
    if (!activeList) return;

    Alert.alert("Xóa nguyên liệu", `Xóa "${item.foodName}" khỏi Shopping List?`, [
      { text: "Hủy", style: "cancel", onPress: () => setDeleteActionItemId(null) },
      {
        text: "Xóa",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteShoppingListItemApi(activeList._id, item._id);
            setDeleteActionItemId(null);
            await loadShoppingLists();
          } catch (error: any) {
            Alert.alert("Không xóa được món", getErrorMessage(error));
          }
        },
      },
    ]);
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
        <NearbyStoresSection />

        <View style={styles.contextToggleRow}>
          <View style={styles.contextToggleContainer}>
            <TouchableOpacity 
              style={[styles.contextToggleBtn, viewMode === 'ACTIVE' && styles.contextToggleBtnActive]}
              onPress={() => setViewMode('ACTIVE')}
              activeOpacity={0.8}
            >
              <Ionicons name="basket" size={14} color={viewMode === 'ACTIVE' ? COLORS.primary : COLORS.onSurfaceVariant} />
              <Text style={[styles.contextToggleText, viewMode === 'ACTIVE' && styles.contextToggleTextActive]}>Cần mua</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.contextToggleBtn, viewMode === 'HISTORY' && styles.contextToggleBtnActive]}
              onPress={() => setViewMode('HISTORY')}
              activeOpacity={0.8}
            >
              <Ionicons name="time" size={14} color={viewMode === 'HISTORY' ? COLORS.primary : COLORS.onSurfaceVariant} />
              <Text style={[styles.contextToggleText, viewMode === 'HISTORY' && styles.contextToggleTextActive]}>Lịch sử</Text>
            </TouchableOpacity>
          </View>
        </View>

        {viewMode === "ACTIVE" ? (
          <>
            <View style={styles.titleContainer}>
          <Text style={styles.title}>{activeList?.listName ?? "Shopping List"}</Text>
          <Text style={styles.subtitle}>Danh sách mua sắm được đồng bộ từ dữ liệu thật.</Text>
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
                  {sectionItems.map((item, idx) => (
                    <ShoppingItemRow
                      key={item._id}
                      item={item}
                      isLast={idx === sectionItems.length - 1}
                      showDeleteAction={deleteActionItemId === item._id}
                      onDelete={() => handleDeleteItem(item)}
                      onEdit={() => handleEditItem(item)}
                      onShowDeleteAction={() => setDeleteActionItemId(item._id)}
                      onToggle={() => handleToggleItem(item)}
                    />
                  ))}
                </View>
              </View>
            );
          })
        ) : null}
        </>
        ) : (
          /* History View */
          <View style={{ paddingHorizontal: 16, marginTop: 16 }}>
            {loading ? (
              <ActivityIndicator color={COLORS.primary} size="large" />
            ) : historyLists.length === 0 ? (
              <View style={styles.emptyAddContainer}>
                <Ionicons name="receipt-outline" size={48} color={COLORS.outlineVariant} />
                <Text style={[styles.title, { marginTop: 16, fontSize: 16, color: COLORS.onSurfaceVariant }]}>Chưa có lịch sử mua sắm</Text>
              </View>
            ) : (
              historyLists.map(list => (
                <View key={list._id} style={[styles.card, { marginBottom: 16, padding: 16 }]}>
                  <Text style={{ fontSize: 16, fontWeight: 'bold', color: COLORS.onSurface }}>{list.listName}</Text>
                  <Text style={{ fontSize: 12, color: COLORS.onSurfaceVariant, marginTop: 4 }}>
                    Hoàn tất: {new Date(list.updatedAt).toLocaleDateString("vi-VN")}
                  </Text>
                  <View style={{ marginTop: 12 }}>
                    {list.items.map((item, idx) => (
                      <View key={item._id} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                        <Ionicons name={item.isPurchased ? "checkmark-circle" : "close-circle"} size={16} color={item.isPurchased ? COLORS.primary : COLORS.outlineVariant} />
                        <Text style={{ marginLeft: 8, fontSize: 14, color: item.isPurchased ? COLORS.onSurface : COLORS.onSurfaceVariant, textDecorationLine: item.isPurchased ? 'none' : 'line-through' }}>
                          {item.foodName} ({item.quantity} {item.unit})
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>

      {hasItems && viewMode === "ACTIVE" && (
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

const styles = StyleSheet.create({
  ...baseStyles,
  contextToggleRow: {
    paddingHorizontal: 16,
    paddingTop: 8,
    marginBottom: 8,
  },
  contextToggleContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceContainerHighest,
    borderRadius: 20,
    padding: 4,
  },
  contextToggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  contextToggleBtnActive: {
    backgroundColor: COLORS.surfaceContainerLowest,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  contextToggleText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.onSurfaceVariant,
  },
  contextToggleTextActive: {
    color: COLORS.primary,
  },
});
