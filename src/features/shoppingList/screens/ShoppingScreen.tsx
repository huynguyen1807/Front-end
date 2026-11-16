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
import { useAppDispatch, useAppSelector } from '../../../redux/hooks';
import HouseholdSelector from '../../familyCloud/components/HouseholdSelector';
import { setSelectedHouseholdId } from '../../familyCloud/redux/familyCloudSlice';
import type { MyHousehold } from '../../familyCloud/types/familyCloud';
import { getHouseholdSubscriptionApi } from '../../subscription/services/paymentApi';
import { getMyHouseholdsApi } from "../../familyCloud/services/familyCloudApi";
import NearbyStoresSection from "../components/NearbyStoresSection";
import {
  addShoppingListItemApi,
  completeShoppingListApi,
  createShoppingListApi,
  deleteShoppingListItemApi,
  getShoppingListsApi,
  getShoppingListByIdApi,
  updateShoppingListItemApi,
} from "../services/shoppingApi";
import { shoppingScreenStyles as baseStyles } from "../styles/ShoppingScreen.styles";
import { ShoppingList, ShoppingListItem, ShoppingOwnerType } from "../types/shopping";

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
  disabled: boolean;
}

function ShoppingItemRow({
  item,
  isLast,
  showDeleteAction,
  onDelete,
  onEdit,
  onShowDeleteAction,
  onToggle,
  disabled,
}: ShoppingItemRowProps) {
  return (
    <View style={[styles.itemWrapper, isLast && styles.itemRowLast]}>
      <TouchableOpacity
        disabled={disabled}
        activeOpacity={0.95}
        onLongPress={onShowDeleteAction}
        delayLongPress={350}
        style={[styles.itemRow, isLast && styles.itemRowLast]}
      >
        <TouchableOpacity
          disabled={disabled}
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
          disabled={disabled}
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
        <TouchableOpacity disabled={disabled} activeOpacity={0.85} style={styles.inlineDeleteAction} onPress={onDelete}>
          <Ionicons name="trash-outline" size={18} color={COLORS.onPrimary} />
          <Text style={styles.deleteActionText}>Xóa nguyên liệu</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function ShoppingScreen() {
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const selectedHouseholdId = useAppSelector(state => state.familyCloud.selectedHouseholdId);
  const [ownerType, setOwnerType] = useState<ShoppingOwnerType>('USER');
  const [households, setHouseholds] = useState<MyHousehold[]>([]);
  const [viewMode, setViewMode] = useState<"ACTIVE" | "HISTORY">("ACTIVE");
  const [lists, setLists] = useState<ShoppingList[]>([]);
  const catalogue = useRef<ShoppingList[]>([]);
  catalogue.current = lists;
  const [historyLists, setHistoryLists] = useState<ShoppingList[]>([]);
  const [selectedListId, setSelectedListId] = useState('');
  const selection = useRef({ contextKey: 'USER', id: '' });
  const [showCreateList, setShowCreateList] = useState(false);
  const [newListName, setNewListName] = useState('');
  const createListScope = useRef('USER');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const refreshingRequest = useRef<AbortSignal | null>(null);
  const manualTarget = useRef<{ contextKey: string; listId: string; viewMode: 'ACTIVE' | 'HISTORY' } | null>(null);
  const [saving, setSaving] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState<ShoppingListItem | null>(null);
  const [deleteActionItemId, setDeleteActionItemId] = useState<string | null>(null);
  const familyHouseholdId = ownerType === 'HOUSEHOLD' ? selectedHouseholdId : '';
  const contextKey = ownerType === 'USER' ? 'USER' : `HOUSEHOLD:${familyHouseholdId}`;
  const [canEdit, setCanEdit] = useState(false);
  const [readOnlyReason, setReadOnlyReason] = useState('');
  const [syncError, setSyncError] = useState('');
  const access = useRef({ householdId: '', contextKey: 'USER', ready: false, canView: false, canEdit: false, generation: 0 });
  const currentContext = useRef(contextKey);
  currentContext.current = contextKey;
  const renderGeneration = access.current.generation;
  const formScope = useRef<string | null>(null);
  const editingListId = useRef<string | null>(null);
  const formListId = useRef('');
  const writeLock = useRef(false);
  const [form, setForm] = useState({
    foodName: "",
    quantity: "1",
    unit: "cái",
  });

  const matchesContext = (list: ShoppingList) => ownerType === 'HOUSEHOLD'
    ? Boolean(familyHouseholdId) && list.ownerType === 'HOUSEHOLD' && listHouseholdId(list) === familyHouseholdId
    : list.ownerType === 'USER' && !listHouseholdId(list);
  const availableLists = lists.filter(matchesContext);
  const activeList = availableLists.find(list => list._id === selectedListId);
  const visibleHistory = historyLists.filter(matchesContext);
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

  const applySelection = (id: string) => {
    if (selection.current.contextKey === contextKey && selection.current.id === id) return;
    selection.current = { contextKey, id }; setSelectedListId(id);
    access.current = { ...access.current, generation: access.current.generation + 1 };
    setDeleteActionItemId(null);
  };

  const refresh = useCallback(async (signal: AbortSignal) => {
    refreshingRequest.current = signal; setRefreshing(true);
    const target = manualTarget.current; manualTarget.current = null;
    const previousContext = access.current;
    if (previousContext.contextKey !== contextKey) {
      access.current = { householdId: familyHouseholdId, contextKey, ready: false, canView: false, canEdit: false, generation: previousContext.generation + 1 };
      setLists([]); setHistoryLists([]); setDeleteActionItemId(null); setCanEdit(false); setLoading(true);
    }
    try {
      const memberships = await getMyHouseholdsApi({ signal, timeout: 10000 });
      if (signal.aborted || currentContext.current !== contextKey) return;
      const available = memberships.filter(item => item.household.status === 'ACTIVE');
      setHouseholds(available);
      const member = ownerType === 'HOUSEHOLD' ? available.find(item => item.household._id === familyHouseholdId) : undefined;
      if (ownerType === 'HOUSEHOLD' && !member) {
        access.current = { ...access.current, ready: false, canView: false, canEdit: false, generation: access.current.generation + 1 };
        setLists([]); setHistoryLists([]); setCanEdit(false);
        if (familyHouseholdId || available.length === 0) setOwnerType('USER');
        setSyncError('Hãy chọn một gia đình đang tham gia để xem danh sách Family.');
        return true;
      }
      const householdId = familyHouseholdId;
      const owner = member?.role === 'OWNER';
      const activeHousehold = !member || member.household.status === 'ACTIVE';
      let canView = activeHousehold && (!member || owner || member.permission?.canViewShoppingList === true);
      let editable = canView && (!member || owner || member.permission?.canEditShoppingList === true);
      if (ownerType === 'HOUSEHOLD' && canView) {
        access.current = { ...access.current, canEdit: false }; setCanEdit(false);
        setReadOnlyReason('Đang kiểm tra quyền Family…');
        const entitlement = await getHouseholdSubscriptionApi(householdId, { signal, timeout: 10000 });
        if (signal.aborted || currentContext.current !== contextKey) return;
        if (entitlement.householdId !== householdId) throw new Error('Thông tin Family không thuộc gia đình đang chọn.');
        const permission = entitlement.memberPermission;
        canView = entitlement.canReadSharedData && (entitlement.canManageSubscription || permission?.canViewShoppingList === true);
        editable = canView && (entitlement.hasFamilyAccess ?? entitlement.hasPaidAccess) === true && !entitlement.readOnly
          && (entitlement.canManageSubscription || permission?.canEditShoppingList === true);
        setReadOnlyReason(editable ? '' : !entitlement.canReadSharedData
          ? 'Gia đình chưa có Family Trial hoặc gói Family hiệu lực.'
          : entitlement.readOnly || !(entitlement.hasFamilyAccess ?? entitlement.hasPaidAccess)
            ? 'Quyền Family đã ngừng hiệu lực. Danh sách được giữ ở chế độ chỉ đọc.'
            : 'Bạn chỉ có quyền xem danh sách mua sắm của gia đình.');
      } else setReadOnlyReason(ownerType === 'USER' ? '' : 'Bạn không có quyền xem danh sách mua sắm của gia đình.');
      const previous = access.current;
      const scopeChanged = !previous.ready || previous.contextKey !== contextKey;
      if (!previous.ready || previous.householdId !== householdId || previous.canView !== canView || previous.canEdit !== editable) {
        access.current = { householdId, contextKey, ready: !scopeChanged, canView, canEdit: editable, generation: previous.generation + 1 };
      }
      if (previous.householdId !== householdId || !canView) {
        setLists([]); setHistoryLists([]); setDeleteActionItemId(null);
      }
      if (scopeChanged || !editable) setCanEdit(false);
      if (!canView) { setSyncError('Bạn không còn quyền xem danh sách mua sắm của gia đình.'); return true; }
      const selectedOnly = target?.contextKey === contextKey && target.viewMode === viewMode && viewMode === 'ACTIVE'
        && Boolean(target.listId) && target.listId === selection.current.id;
      let data: ShoppingList[];
      if (selectedOnly) {
        try { data = [await getShoppingListByIdApi(target!.listId, { signal, timeout: 10000 })]; }
        catch (error: any) { if (error?.response?.status === 404) data = []; else throw error; }
      } else {
        data = await getShoppingListsApi(viewMode === 'ACTIVE' ? 'ACTIVE' : 'COMPLETED', { signal, timeout: 10000,
          context: ownerType === 'USER' ? { ownerType: 'USER' } : { ownerType: 'HOUSEHOLD', householdId } });
      }
      if (signal.aborted || currentContext.current !== contextKey) return;
      access.current.ready = true; setCanEdit(editable);
      const requestedStatus = viewMode === 'ACTIVE' ? 'ACTIVE' : 'COMPLETED';
      const scoped = data.filter(list => list.status === requestedStatus && (ownerType === 'HOUSEHOLD'
        ? list.ownerType === 'HOUSEHOLD' && listHouseholdId(list) === householdId
        : list.ownerType === 'USER' && !listHouseholdId(list)));
      if (viewMode === 'ACTIVE') {
        const next = selectedOnly ? [...catalogue.current.filter(list => matchesContext(list) && list._id !== target!.listId), ...scoped] : scoped;
        catalogue.current = next; setLists(next);
        const preferred = selection.current.contextKey === contextKey ? selection.current.id : '';
        applySelection(next.some(list => list._id === preferred) ? preferred : next[0]?._id ?? '');
      } else setHistoryLists(scoped);
      setSyncError(formScope.current !== null && (formScope.current !== contextKey || formListId.current !== selection.current.id)
        ? 'Ngữ cảnh hoặc danh sách mua sắm đã thay đổi. Đóng form và mở lại trước khi lưu.' : '');
      return true;
    } catch (error: any) {
      if (signal.aborted || currentContext.current !== contextKey) return;
      if (ownerType === 'HOUSEHOLD') {
        access.current = { ...access.current, canEdit: false }; setCanEdit(false);
        setReadOnlyReason('Chưa xác minh được quyền Family. Tạm thời chỉ xem dữ liệu hiện có.');
      }
      if ([401, 403].includes(error?.response?.status)) {
        access.current = { ...access.current, ready: false, canView: false, canEdit: false, generation: access.current.generation + 1 };
        setLists([]); setHistoryLists([]); setCanEdit(false);
      }
      setSyncError(getErrorMessage(error));
      return false;
    } finally {
      if (refreshingRequest.current === signal) { refreshingRequest.current = null; setRefreshing(false); }
      if (!signal.aborted && currentContext.current === contextKey) setLoading(false);
    }
  }, [viewMode, ownerType, familyHouseholdId, contextKey]);
  const sync = useHouseholdSync({ scopeKey: `shopping:${contextKey}:${viewMode}`, polling: ownerType === 'HOUSEHOLD' && Boolean(familyHouseholdId), refresh });

  const selectContext = (nextOwner: ShoppingOwnerType, householdId = '') => {
    if (saving || writeLock.current) return;
    if (nextOwner === 'HOUSEHOLD' && householdId && !households.some(item => item.household._id === householdId)) return;
    const nextKey = nextOwner === 'USER' ? 'USER' : `HOUSEHOLD:${householdId}`;
    if (nextKey === contextKey) return;
    sync.cancel();
    manualTarget.current = null;
    currentContext.current = nextKey;
    access.current = { householdId, contextKey: nextKey, ready: false, canView: false, canEdit: false, generation: access.current.generation + 1 };
    selection.current = { contextKey: nextKey, id: '' }; setSelectedListId('');
    setReadOnlyReason('');
    setShowCreateList(false); setNewListName('');
    setLists([]); setHistoryLists([]); setCanEdit(false); setLoading(true); setDeleteActionItemId(null); setSyncError('');
    if (nextOwner === 'HOUSEHOLD') dispatch(setSelectedHouseholdId(householdId));
    setOwnerType(nextOwner);
  };

  const selectList = (id: string) => {
    if (saving || writeLock.current || refreshingRequest.current || contextKey !== currentContext.current || !availableLists.some(list => list._id === id)) return;
    applySelection(id);
    setSyncError(formScope.current !== null && formListId.current !== id ? 'Danh sách đã thay đổi. Đóng form và mở lại trước khi lưu.' : '');
  };

  const manualRefresh = () => {
    if (saving || loading || writeLock.current || refreshingRequest.current) return;
    manualTarget.current = { contextKey, listId: selection.current.id, viewMode };
    void sync.refresh();
  };

  const runWrite = async (operation: () => Promise<void>, title: string, generation = renderGeneration) => {
    if (writeLock.current) return;
    if (contextKey !== currentContext.current || contextKey !== access.current.contextKey || selection.current.contextKey !== contextKey
      || selection.current.id !== selectedListId || !access.current.ready || !access.current.canEdit || generation !== access.current.generation) {
      notify('Quyền truy cập', 'Quyền hoặc ngữ cảnh đã thay đổi. Hãy làm mới danh sách trước khi thử lại.'); return;
    }
    writeLock.current = true; sync.pause(); setSaving(true);
    try { await operation(); }
    catch (error: any) {
      if (ownerType === 'HOUSEHOLD' && error?.response?.status === 403) {
        access.current = { ...access.current, canEdit: false, generation: access.current.generation + 1 };
        setCanEdit(false); setReadOnlyReason('Quyền Family đã thay đổi. Danh sách tạm thời chỉ đọc.');
      }
      setSyncError(getErrorMessage(error)); notify(title, getErrorMessage(error));
    }
    finally { writeLock.current = false; setSaving(false); sync.resume(); }
  };

  const createList = async (listName: string) => {
    if (ownerType === 'HOUSEHOLD' && !familyHouseholdId) throw new Error('Hãy chọn gia đình trước khi tạo danh sách.');
    const created = await createShoppingListApi({
      ownerType, ...(ownerType === 'HOUSEHOLD' ? { householdId: familyHouseholdId } : {}),
      listName, visibility: ownerType === 'HOUSEHOLD' ? 'SHARED' : 'PERSONAL',
    });
    if (!matchesContext(created)) throw new Error('Danh sách trả về không thuộc ngữ cảnh đang chọn.');
    const next = [...catalogue.current.filter(list => list._id !== created._id), created];
    catalogue.current = next; setLists(next);
    applySelection(created._id);
    return created;
  };

  const ensureActiveList = async () => activeList ?? createList(ownerType === 'HOUSEHOLD' ? 'Danh sách mua sắm gia đình' : 'Danh sách mua sắm');

  const handleCreateList = async () => {
    if (createListScope.current !== contextKey) return;
    const name = newListName.trim();
    if (!name) { notify('Thiếu tên danh sách', 'Vui lòng nhập tên danh sách mua sắm.'); return; }
    await runWrite(async () => {
      await createList(name); setShowCreateList(false); setNewListName('');
    }, 'Không tạo được danh sách');
  };

  const resetForm = () => {
    formScope.current = null; editingListId.current = null;
    formListId.current = '';
    setForm({ foodName: "", quantity: "1", unit: "cái" });
    setEditingItem(null);
    setShowAddForm(false);
  };

  const handleEditItem = (item: ShoppingListItem) => {
    if (!canEdit || saving || !activeList || contextKey !== currentContext.current || !access.current.ready) return;
    formScope.current = contextKey; editingListId.current = activeList._id;
    formListId.current = selectedListId;
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
    if (contextKey !== access.current.contextKey || formScope.current !== contextKey || formListId.current !== selectedListId || (editingItem &&
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
    if (!activeList || !canEdit || !access.current.canEdit || saving) return;

    const generation = access.current.generation;
    confirm("Xóa nguyên liệu", `Xóa "${item.foodName}" khỏi Shopping List?`, () => {
          void runWrite(async () => {
            await deleteShoppingListItemApi(activeList._id, item._id);
            setDeleteActionItemId(null);
          }, 'Không xóa được món', generation);
    });
  };

  const handleCompleteList = () => {
    if (!canEdit || !access.current.canEdit || saving) return;
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
    if (!canEdit || saving || contextKey !== currentContext.current || !access.current.ready) return;
    formScope.current = contextKey; editingListId.current = null;
    formListId.current = selectedListId;
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
            <TouchableOpacity accessibilityRole="tab" accessibilityLabel="Danh sách cá nhân" accessibilityState={{ selected: ownerType === 'USER' }} disabled={saving}
              style={[styles.contextToggleBtn, ownerType === 'USER' && styles.contextToggleBtnActive]} onPress={() => selectContext('USER')}>
              <Text style={[styles.contextToggleText, ownerType === 'USER' && styles.contextToggleTextActive]}>Cá nhân</Text>
            </TouchableOpacity>
            {households.length > 0 ? <TouchableOpacity accessibilityRole="tab" accessibilityLabel="Danh sách gia đình" accessibilityState={{ selected: ownerType === 'HOUSEHOLD' }} disabled={saving}
              style={[styles.contextToggleBtn, ownerType === 'HOUSEHOLD' && styles.contextToggleBtnActive]} onPress={() => selectContext('HOUSEHOLD',
                households.some(item => item.household._id === selectedHouseholdId) ? selectedHouseholdId : households.length === 1 ? households[0].household._id : '')}>
              <Text style={[styles.contextToggleText, ownerType === 'HOUSEHOLD' && styles.contextToggleTextActive]}>Gia đình</Text>
            </TouchableOpacity> : null}
          </View>
          {ownerType === 'HOUSEHOLD' ? <HouseholdSelector households={households} selectedHouseholdId={familyHouseholdId}
            onSelectHousehold={id => selectContext('HOUSEHOLD', id)} /> : null}
        </View>

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
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Làm mới danh sách mua sắm" disabled={loading || saving || refreshing}
          onPress={manualRefresh} style={styles.cancelEditButton}>
          <Text style={styles.cancelEditButtonText}>{refreshing ? 'Đang làm mới…' : 'Làm mới danh sách'}</Text>
        </TouchableOpacity>
        {ownerType === 'HOUSEHOLD' && readOnlyReason ? <Text accessibilityLiveRegion="polite" style={{ paddingHorizontal: 16, color: COLORS.onSurfaceVariant }}>{readOnlyReason}</Text> : null}

        {viewMode === "ACTIVE" ? (
          <>
            <View style={styles.contextToggleRow}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {availableLists.map(list => <TouchableOpacity key={list._id} accessibilityRole="button" accessibilityLabel={`Chọn danh sách ${list.listName}`}
                  accessibilityState={{ selected: list._id === selectedListId }} disabled={saving || refreshing}
                  onPress={() => selectList(list._id)} style={[styles.contextToggleBtn, styles.listChoice, list._id === selectedListId && styles.contextToggleBtnActive]}>
                  <Text style={[styles.contextToggleText, list._id === selectedListId && styles.contextToggleTextActive]}>{list.listName}</Text>
                </TouchableOpacity>)}
              </ScrollView>
              <TouchableOpacity accessibilityRole="button" accessibilityLabel="Tạo danh sách mới" disabled={loading || saving || !canEdit} style={styles.cancelEditButton}
                onPress={() => { if (!access.current.ready || !access.current.canEdit || writeLock.current) return; createListScope.current = contextKey; setShowCreateList(true); }}>
                <Text style={styles.cancelEditButtonText}>Tạo danh sách mới</Text>
              </TouchableOpacity>
              {showCreateList ? <View style={styles.addForm}>
                <TextInput editable={!saving && canEdit} accessibilityLabel="Tên danh sách mới" placeholder="Tên danh sách" value={newListName} onChangeText={setNewListName} style={styles.input} />
                <TouchableOpacity accessibilityRole="button" accessibilityLabel="Xác nhận tạo danh sách" disabled={saving || !canEdit || createListScope.current !== contextKey} onPress={() => void handleCreateList()} style={styles.addButton}>
                  <Text style={styles.addButtonText}>Tạo danh sách</Text>
                </TouchableOpacity>
                <TouchableOpacity disabled={saving} onPress={() => setShowCreateList(false)} style={styles.cancelEditButton}><Text style={styles.cancelEditButtonText}>Đóng</Text></TouchableOpacity>
              </View> : null}
            </View>
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
              editable={!saving && canEdit}
              value={form.foodName}
              onChangeText={(value) => setForm((prev) => ({ ...prev, foodName: value }))}
              placeholder="VD: Cà chua bi"
              placeholderTextColor={COLORS.onSurfaceVariant}
              style={styles.input}
            />
            <View style={styles.formRow}>
              <TextInput
                editable={!saving && canEdit}
                value={form.quantity}
                onChangeText={(value) => setForm((prev) => ({ ...prev, quantity: value }))}
                keyboardType="decimal-pad"
                placeholder="Số lượng"
                placeholderTextColor={COLORS.onSurfaceVariant}
                style={[styles.input, styles.quantityInput]}
              />
              <TextInput
                editable={!saving && canEdit}
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
              disabled={saving || !canEdit || formScope.current !== contextKey || formListId.current !== selectedListId}
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
                      disabled={saving || !canEdit}
                      isLast={idx === sectionItems.length - 1}
                      showDeleteAction={deleteActionItemId === item._id}
                      onDelete={() => handleDeleteItem(item)}
                      onEdit={() => handleEditItem(item)}
                      onShowDeleteAction={() => { if (canEdit && !saving) setDeleteActionItemId(item._id); }}
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
            ) : visibleHistory.length === 0 ? (
              <View style={styles.emptyAddContainer}>
                <Ionicons name="receipt-outline" size={48} color={COLORS.outlineVariant} />
                <Text style={[styles.title, { marginTop: 16, fontSize: 16, color: COLORS.onSurfaceVariant }]}>Chưa có lịch sử mua sắm</Text>
              </View>
            ) : (
              visibleHistory.map(list => (
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
  listChoice: { flex: 0, paddingHorizontal: 14, marginRight: 8 },
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
