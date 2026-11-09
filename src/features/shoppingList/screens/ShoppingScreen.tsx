import { useCallback, useMemo, useRef, useState } from "react";
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
import { useHouseholdSync } from "../../../hooks/useHouseholdSync";
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

function notify(title: string, message: string) {
  if (Platform.OS === 'web') window.alert(`${title}\n${message}`);
  else Alert.alert(title, message);
}

function confirm(title: string, message: string, action: () => void) {
  if (Platform.OS === 'web') { if (window.confirm(`${title}\n${message}`)) action(); }
  else Alert.alert(title, message, [{ text: 'Hủy', style: 'cancel' }, { text: 'Xác nhận', onPress: action }]);
}

function listHouseholdId(list: ShoppingList) {
  return typeof list.householdId === 'string' ? list.householdId : list.householdId?._id;
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
  const [canEdit, setCanEdit] = useState(false);
  const [syncError, setSyncError] = useState('');
  const access = useRef({ householdId: '', ready: false, canView: false, canEdit: false, generation: 0 });
  const formScope = useRef<string | null>(null);
  const editingListId = useRef<string | null>(null);
  const writeLock = useRef(false);
  const [form, setForm] = useState({
    foodName: "",
    quantity: "1",
    unit: "cái",
  });

  const activeList = lists.find((list) => familyHouseholdId
    ? list.ownerType === 'HOUSEHOLD' && listHouseholdId(list) === familyHouseholdId
    : list.ownerType !== 'HOUSEHOLD' && !listHouseholdId(list));
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

  const refresh = useCallback(async (signal: AbortSignal) => {
    try {
      const memberships = await getMyHouseholdsApi({ signal, timeout: 10000 });
      if (signal.aborted) return;
      const member = memberships[0];
      const householdId = member?.household._id ?? '';
      const canView = !member || member.permission?.canViewShoppingList === true;
      const editable = canView && (!member || member.permission?.canEditShoppingList === true);
      const previous = access.current;
      const scopeChanged = !previous.ready || previous.householdId !== householdId;
      if (!previous.ready || previous.householdId !== householdId || previous.canView !== canView || previous.canEdit !== editable) {
        access.current = { householdId, ready: !scopeChanged, canView, canEdit: editable, generation: previous.generation + 1 };
      }
      if (previous.householdId !== householdId || !canView) {
        setLists([]); setHistoryLists([]); setDeleteActionItemId(null);
      }
      setFamilyHouseholdId(householdId);
      if (scopeChanged || !editable) setCanEdit(false);
      if (!canView) { setSyncError('Bạn không còn quyền xem danh sách mua sắm của gia đình.'); return true; }
      const data = await getShoppingListsApi(viewMode === 'ACTIVE' ? 'ACTIVE' : 'COMPLETED', { signal, timeout: 10000 });
      if (signal.aborted) return;
      access.current.ready = true; setCanEdit(editable);
      const scoped = data.filter(list => householdId
        ? list.ownerType === 'HOUSEHOLD' && listHouseholdId(list) === householdId
        : list.ownerType !== 'HOUSEHOLD' && !listHouseholdId(list));
      if (viewMode === 'ACTIVE') setLists(scoped); else setHistoryLists(scoped);
      setSyncError(formScope.current !== null && formScope.current !== householdId
        ? 'Ngữ cảnh gia đình đã thay đổi. Đóng form và mở lại trước khi lưu.' : '');
      return true;
    } catch (error: any) {
      if (signal.aborted) return;
      if ([401, 403].includes(error?.response?.status)) {
        access.current = { ...access.current, ready: false, canView: false, canEdit: false, generation: access.current.generation + 1 };
        setLists([]); setHistoryLists([]); setCanEdit(false);
      }
      setSyncError(getErrorMessage(error));
      return false;
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  }, [viewMode]);
  const sync = useHouseholdSync({ scopeKey: `shopping:${viewMode}`, polling: Boolean(familyHouseholdId), refresh });

  const runWrite = async (operation: () => Promise<void>, title: string, generation = access.current.generation) => {
    if (writeLock.current) return;
    if (!access.current.ready || !access.current.canEdit || generation !== access.current.generation) {
      notify('Quyền truy cập', 'Quyền hoặc ngữ cảnh đã thay đổi. Hãy làm mới danh sách trước khi thử lại.'); return;
    }
    writeLock.current = true; sync.pause(); setSaving(true);
    try { await operation(); }
    catch (error: any) { setSyncError(getErrorMessage(error)); notify(title, getErrorMessage(error)); }
    finally { writeLock.current = false; setSaving(false); sync.resume(); }
  };

  const ensureActiveList = async () => {
    if (familyHouseholdId) {
      if (activeList) return activeList;

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
    formScope.current = null; editingListId.current = null;
    setForm({ foodName: "", quantity: "1", unit: "cái" });
    setEditingItem(null);
    setShowAddForm(false);
  };

  const handleEditItem = (item: ShoppingListItem) => {
    if (!canEdit || saving || !activeList) return;
    formScope.current = access.current.householdId; editingListId.current = activeList._id;
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
    if (formScope.current !== access.current.householdId || (editingItem &&
      (editingListId.current !== activeList?._id || !activeList?.items.some(item => item._id === editingItem._id)))) {
      notify('Danh sách đã thay đổi', 'Món hoặc ngữ cảnh đang sửa đã thay đổi. Đóng form và mở lại trước khi lưu.'); return;
    }
    const foodName = form.foodName.trim();
    const quantityText = form.quantity.trim();
    const quantity = parseQuantityInput(form.quantity);
    const unit = form.unit.trim();
    const validationError = validateShoppingItemForm(foodName, quantityText, quantity, unit);

    if (validationError) {
      notify("Thông tin chưa hợp lệ", validationError);
      return;
    }

    await runWrite(async () => {
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
    }, editingItem ? 'Không sửa được món' : 'Không thêm được món');
  };

  const handleToggleItem = async (item: ShoppingListItem) => {
    if (!activeList) return;

    await runWrite(async () => {
      await updateShoppingListItemApi(activeList._id, item._id, {
        isPurchased: !item.isPurchased,
      });
      setDeleteActionItemId(null);
    }, 'Không cập nhật được món');
  };

  const handleDeleteItem = (item: ShoppingListItem) => {
    if (!activeList) return;

    const generation = access.current.generation;
    confirm("Xóa nguyên liệu", `Xóa "${item.foodName}" khỏi Shopping List?`, () => {
          void runWrite(async () => {
            await deleteShoppingListItemApi(activeList._id, item._id);
            setDeleteActionItemId(null);
          }, 'Không xóa được món', generation);
    });
  };

  const handleCompleteList = () => {
    if (!activeList) {
      notify("Chưa có danh sách", "Hãy thêm món đầu tiên để tạo Shopping List.");
      return;
    }

    const generation = access.current.generation;
    confirm("Hoàn tất danh sách", "Đánh dấu shopping list này là đã hoàn tất?", () => {
          void runWrite(async () => {
            await completeShoppingListApi(activeList._id);
          }, 'Không hoàn tất được', generation);
    });
  };

  const openAddForm = () => {
    if (!canEdit || saving) return;
    formScope.current = access.current.householdId; editingListId.current = null;
    setShowAddForm(true);
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
              disabled={saving}
              style={[styles.contextToggleBtn, viewMode === 'ACTIVE' && styles.contextToggleBtnActive]}
              onPress={() => setViewMode('ACTIVE')}
              activeOpacity={0.8}
            >
              <Ionicons name="basket" size={14} color={viewMode === 'ACTIVE' ? COLORS.primary : COLORS.onSurfaceVariant} />
              <Text style={[styles.contextToggleText, viewMode === 'ACTIVE' && styles.contextToggleTextActive]}>Cần mua</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              disabled={saving}
              style={[styles.contextToggleBtn, viewMode === 'HISTORY' && styles.contextToggleBtnActive]}
              onPress={() => setViewMode('HISTORY')}
              activeOpacity={0.8}
            >
              <Ionicons name="time" size={14} color={viewMode === 'HISTORY' ? COLORS.primary : COLORS.onSurfaceVariant} />
              <Text style={[styles.contextToggleText, viewMode === 'HISTORY' && styles.contextToggleTextActive]}>Lịch sử</Text>
            </TouchableOpacity>
          </View>
        </View>

        {syncError ? <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
          <Text accessibilityLiveRegion="polite" style={{ color: COLORS.error }}>{syncError}</Text>
          <TouchableOpacity disabled={saving} onPress={() => void sync.refresh()}><Text style={{ color: COLORS.primary }}>Thử đồng bộ lại</Text></TouchableOpacity>
        </View> : null}
        {familyHouseholdId && !canEdit ? <Text style={{ paddingHorizontal: 16, color: COLORS.onSurfaceVariant }}>Danh sách gia đình đang ở chế độ chỉ xem hoặc chưa có quyền truy cập.</Text> : null}

        {viewMode === "ACTIVE" ? (
          <>
            <View style={styles.titleContainer}>
          <Text style={styles.title}>{activeList?.listName ?? "Shopping List"}</Text>
          <Text style={styles.subtitle}>Danh sách mua sắm được đồng bộ từ dữ liệu thật.</Text>
        </View>

        {hasItems && (
          <TouchableOpacity disabled={saving || !canEdit} activeOpacity={0.9} style={styles.bannerButton} onPress={handleCompleteList}>
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
              disabled={saving || !canEdit || formScope.current !== access.current.householdId}
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
            {showAddForm && (
              <TouchableOpacity disabled={saving} activeOpacity={0.85} onPress={resetForm} style={styles.cancelEditButton}>
                <Text style={styles.cancelEditButtonText}>Đóng form</Text>
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
              disabled={!canEdit || saving}
              onPress={openAddForm}
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
                    Hoàn tất: {list.updatedAt ? new Date(list.updatedAt).toLocaleDateString("vi-VN") : "-"}
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
          disabled={saving || !canEdit}
          activeOpacity={0.85}
          style={[styles.fab, { bottom: fabBottom }]}
          onPress={() => {
            if (showAddForm) {
              resetForm();
              return;
            }
            openAddForm();
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
