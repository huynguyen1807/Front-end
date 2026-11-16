import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useAppSelector } from '../../../redux/hooks';
import { COLORS } from '../../../constants/colors';
import HouseholdSelector from '../../familyCloud/components/HouseholdSelector';
import { getMyHouseholdsApi } from '../../familyCloud/services/familyCloudApi';
import type { MyHousehold } from '../../familyCloud/types/familyCloud';
import { getHouseholdSubscriptionApi } from '../../subscription/services/paymentApi';
import { getShoppingListsApi } from '../services/shoppingApi';
import type { ShoppingDestination, ShoppingList } from '../types/shopping';

type Props = { visible: boolean; disabled: boolean; onChange: (destination: ShoppingDestination | undefined, ready: boolean) => void };

export default function ShoppingDestinationPicker({ visible, disabled, onChange }: Props) {
  const preferredHousehold = useAppSelector(state => state.familyCloud.selectedHouseholdId);
  const [households, setHouseholds] = useState<MyHousehold[]>([]);
  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [ownerType, setOwnerType] = useState<'USER' | 'HOUSEHOLD'>('USER');
  const [householdId, setHouseholdId] = useState('');
  const [listId, setListId] = useState('');
  const [loading, setLoading] = useState(false);
  const loadingRequest = useRef(false);
  const [error, setError] = useState('');
  const generation = useRef(0);
  const callback = useRef(onChange); callback.current = onChange;

  useEffect(() => {
    if (!visible) return;
    const request = ++generation.current, abort = new AbortController();
    loadingRequest.current = true;
    setOwnerType('USER'); setHouseholdId(''); setListId(''); setError(''); setLoading(true);
    callback.current(undefined, false);
    void Promise.all([getMyHouseholdsApi({ signal: abort.signal, timeout: 10000 }),
      getShoppingListsApi('ACTIVE', { signal: abort.signal, timeout: 10000 })]).then(([members, data]) => {
      if (abort.signal.aborted || request !== generation.current) return;
      setHouseholds(members.filter(item => item.household.status === 'ACTIVE')); setLists(data);
    }).catch(() => {
      if (!abort.signal.aborted) setError('Chưa tải được các danh sách. Bạn vẫn có thể thêm vào danh sách Personal từ kế hoạch ăn.');
    }).finally(() => { if (!abort.signal.aborted && request === generation.current) { loadingRequest.current = false; setLoading(false); } });
    return () => { generation.current++; abort.abort(); };
  }, [visible]);

  useEffect(() => {
    if (!visible || loading || loadingRequest.current) return;
    if (ownerType === 'USER') {
      const valid = !listId || lists.some(list => list._id === listId && list.ownerType === 'USER' && list.status === 'ACTIVE');
      callback.current(listId ? { ownerType: 'USER', listId } : undefined, valid); return;
    }
    const abort = new AbortController();
    callback.current(undefined, false);
    if (!householdId || !listId || !households.some(item => item.household._id === householdId)) return;
    const list = lists.find(item => item._id === listId);
    const id = typeof list?.householdId === 'string' ? list.householdId : list?.householdId?._id;
    if (!list || list.ownerType !== 'HOUSEHOLD' || id !== householdId || list.status !== 'ACTIVE') return;
    void getHouseholdSubscriptionApi(householdId, { signal: abort.signal, timeout: 10000 }).then(entitlement => {
      if (abort.signal.aborted) return;
      const permission = entitlement.memberPermission;
      const allowed = entitlement.householdId === householdId && (entitlement.hasFamilyAccess ?? entitlement.hasPaidAccess) === true
        && !entitlement.readOnly && (entitlement.canManageSubscription || (permission?.canViewShoppingList && permission?.canEditShoppingList));
      setError(allowed ? '' : 'Danh sách Family chỉ đọc hoặc bạn chưa có quyền chỉnh sửa.');
      callback.current({ ownerType: 'HOUSEHOLD', householdId, listId }, Boolean(allowed));
    }).catch(() => { if (!abort.signal.aborted) setError('Chưa xác minh được quyền Family. Vui lòng chọn Personal hoặc thử lại sau.'); });
    return () => abort.abort();
  }, [visible, loading, ownerType, householdId, listId, lists, households]);

  const changeContext = (owner: 'USER' | 'HOUSEHOLD', id = '') => {
    if (disabled || (owner === 'HOUSEHOLD' && id && !households.some(item => item.household._id === id))) return;
    callback.current(undefined, false); setOwnerType(owner); setHouseholdId(id); setListId(''); setError('');
  };
  const choices = lists.filter(list => list.status === 'ACTIVE' && (ownerType === 'USER' ? list.ownerType === 'USER'
    : list.ownerType === 'HOUSEHOLD' && (typeof list.householdId === 'string' ? list.householdId : list.householdId?._id) === householdId));
  const choice = (label: string, selected: boolean, onPress: () => void) => <TouchableOpacity accessibilityRole="button"
    accessibilityState={{ selected }} disabled={disabled || loading} onPress={onPress}
    style={{ padding: 8, borderWidth: 1, borderColor: selected ? COLORS.primary : COLORS.outlineVariant, borderRadius: 8, margin: 3 }}>
    <Text style={{ color: COLORS.onSurface }}>{label}</Text>
  </TouchableOpacity>;

  if (!visible) return null;
  return <View>
    <Text style={{ color: COLORS.onSurface, fontWeight: '700' }}>Đích nhận nguyên liệu</Text>
    <View style={{ flexDirection: 'row' }}>
      {choice('Cá nhân', ownerType === 'USER', () => changeContext('USER'))}
      {households.length > 0 && choice('Gia đình', ownerType === 'HOUSEHOLD', () => changeContext('HOUSEHOLD',
        households.some(item => item.household._id === preferredHousehold) ? preferredHousehold : households.length === 1 ? households[0].household._id : ''))}
    </View>
    {ownerType === 'HOUSEHOLD' && <HouseholdSelector households={households} selectedHouseholdId={householdId} onSelectHousehold={id => changeContext('HOUSEHOLD', id)} />}
    {loading ? <ActivityIndicator /> : <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      {ownerType === 'USER' && choice('Personal từ kế hoạch ăn', !listId, () => { if (!disabled) { callback.current(undefined, true); setListId(''); } })}
      {choices.map(list => <View key={list._id}>{choice(list.listName, listId === list._id, () => {
        callback.current(undefined, false); setListId(list._id); setError('');
      })}</View>)}
    </ScrollView>}
    {ownerType === 'HOUSEHOLD' && !listId && <Text style={{ color: COLORS.onSurfaceVariant }}>Chọn danh sách Family hiện có. Bạn có thể tạo danh sách trong màn hình Mua sắm.</Text>}
    {error ? <Text accessibilityLiveRegion="polite" style={{ color: COLORS.error }}>{error}</Text> : null}
  </View>;
}
