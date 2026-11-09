import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, ActivityIndicator,
  RefreshControl, Platform, Alert, StyleSheet, useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import BottomNavbar from '../../../components/layout/BottomNavbar';
import ScreenContainer from '../../../components/layout/ScreenContainer';
import TopNavbar from '../../../components/layout/TopNavbar';
import { COLORS } from '../../../constants/colors';
import { reloadPageOrRefresh } from '../../../utils/reloadPage';
import { useAppDispatch, useAppSelector } from '../../../redux/hooks';
import InventoryGridCard from '../components/InventoryGridCard';
import { fetchFoods, fetchSummary, setActiveFilter, deleteFood, consumeFood, setInventoryContext, invalidateInventoryAccess } from '../redux/inventorySlice';
import { useHouseholdSync } from '../../../hooks/useHouseholdSync';
import { InventoryFilter, FoodItem, StorageTypeBackend } from '../types/inventory';
import { getMyHouseholdsApi } from '../../familyCloud/services/familyCloudApi';
import { MyHousehold } from '../../familyCloud/types/familyCloud';

const FILTERS: { key: Exclude<InventoryFilter, 'all'>; label: string; icon: keyof typeof Ionicons.glyphMap; color: string }[] = [
  { key: 'SAFE', label: 'Còn tốt', icon: 'leaf-outline', color: COLORS.primary },
  { key: 'NEAR_EXPIRY', label: 'Sắp hết hạn', icon: 'time-outline', color: COLORS.secondary },
  { key: 'EXPIRED', label: 'Đã hết hạn', icon: 'alert-circle-outline', color: COLORS.error },
  { key: 'NEED_CHECK', label: 'Cần kiểm tra', icon: 'scan-outline', color: COLORS.onSurfaceVariant },
];

const STORAGE_ICONS: Record<StorageTypeBackend, keyof typeof Ionicons.glyphMap> = {
  REFRIGERATOR: 'file-tray-stacked-outline', FREEZER: 'snow-outline', OUTSIDE: 'sunny-outline',
  PANTRY: 'basket-outline', KITCHEN_CABINET: 'albums-outline', CUSTOM: 'cube-outline',
};

// Keep each storage frame small. Rebalance the final frame so five items
// become 3 + 2 rather than leaving one isolated item after a full frame.
function splitFrames(items: FoodItem[]): FoodItem[][] {
  const frames: FoodItem[][] = [];
  for (let start = 0; start < items.length;) {
    const size = items.length - start === 5 ? 3 : 4;
    frames.push(items.slice(start, start + size));
    start += size;
  }
  return frames;
}

export default function InventoryDashboardScreen() {
  const dispatch = useAppDispatch();
  const navigation = useNavigation<any>();
  const { width, fontScale } = useWindowDimensions();
  const { items, summary, activeFilter, loading, error, context } = useAppSelector((s) => s.inventory);
  const [households, setHouseholds] = useState<MyHousehold[]>([]);
  const [syncError, setSyncError] = useState('');
  const mutationLock = useRef(false);
  const [activeLocationFilter, setActiveLocationFilter] = useState<string | null>(null);
  const contentWidth = Math.min(width, 1120);
  const columns = width < 340 || fontScale > 1.35 ? 1 : contentWidth >= 900 ? 4 : 2;
  const pagePadding = width < 380 ? 16 : 20;
  const gridWidth = contentWidth - pagePadding * 2 - 28 - 2;

  const membership = households.find((item) => item.household._id === context.householdId);
  const canEdit = context.ownerType === 'USER' || membership?.permission?.canEditInventory === true;
  const refresh = useCallback(async (signal: AbortSignal) => {
    try {
      const memberships = await getMyHouseholdsApi({ signal, timeout: 10000 });
      if (signal.aborted) return;
      setHouseholds(memberships);
      const member = memberships.find((item) => item.household._id === context.householdId);
      if (context.ownerType === 'HOUSEHOLD' && member?.permission?.canViewInventory !== true) {
        const message = 'Bạn không còn quyền xem kho gia đình này.';
        dispatch(invalidateInventoryAccess(message)); setSyncError(message);
        return true;
      }
      const foods = dispatch(fetchFoods(activeFilter === 'all' ? undefined : activeFilter));
      const summary = dispatch(fetchSummary());
      const abort = () => { foods.abort(); summary.abort(); };
      signal.addEventListener('abort', abort, { once: true });
      try { await Promise.all([foods.unwrap(), summary.unwrap()]); }
      catch (error) { abort(); throw error; }
      finally { signal.removeEventListener('abort', abort); }
      if (!signal.aborted) setSyncError('');
      return true;
    } catch (error: any) {
      if (signal.aborted) return;
      if ([401, 403].includes(error?.status ?? error?.response?.status)) {
        dispatch(invalidateInventoryAccess('Bạn không có quyền truy cập kho này.'));
      }
      setSyncError('Chưa đồng bộ được kho. Vui lòng kiểm tra kết nối hoặc quyền truy cập.');
      return false;
    }
  }, [activeFilter, context.ownerType, context.householdId, dispatch]);
  const sync = useHouseholdSync({ scopeKey: `${context.ownerType}:${context.householdId ?? ''}:${activeFilter}`,
    polling: context.ownerType === 'HOUSEHOLD', refresh });
  const load = () => { void sync.refresh(); };

  const groupedItems = useMemo(() => {
    const groups = new Map<string, { name: string; type?: StorageTypeBackend; items: FoodItem[] }>();
    items.forEach((item) => {
      const location = item.storageLocationId;
      const key = location?._id || location?.storageName || 'unassigned';
      if (!groups.has(key)) groups.set(key, { name: location?.storageName || 'Chưa phân loại', type: location?.storageType, items: [] });
      groups.get(key)!.items.push(item);
    });
    return [...groups.entries()].sort(([, a], [, b]) => a.name.localeCompare(b.name, 'vi'));
  }, [items]);

  // A previous location may no longer exist after changing owner/filter/deleting.
  const selectedLocation = groupedItems.some(([key]) => key === activeLocationFilter) ? activeLocationFilter : null;
  const visibleGroups = selectedLocation ? groupedItems.filter(([key]) => key === selectedLocation) : groupedItems;
  const visibleCount = visibleGroups.reduce((count, [, group]) => count + group.items.length, 0);
  const counts = { SAFE: summary.safe, NEAR_EXPIRY: summary.nearExpiry, EXPIRED: summary.expired, NEED_CHECK: summary.needCheck ?? 0 };

  const confirmAction = (item: FoodItem, kind: 'delete' | 'consume') => {
    const title = kind === 'delete' ? 'Xoá thực phẩm' : 'Đánh dấu đã dùng';
    const message = kind === 'delete' ? `Xoá "${item.foodName}"?` : `Đã dùng hết "${item.foodName}"?`;
    const perform = async () => {
      if (!canEdit || mutationLock.current) return;
      mutationLock.current = true; sync.pause();
      try {
        if (kind === 'delete') await dispatch(deleteFood(item._id)).unwrap();
        else await dispatch(consumeFood(item._id)).unwrap();
      } catch {
        Alert.alert('Chưa cập nhật được', 'Vui lòng kiểm tra kết nối và thử lại.');
      } finally { mutationLock.current = false; sync.resume(); }
    };
    if (!canEdit) {
      const message = 'Bạn không có quyền sửa kho gia đình này.';
      if (Platform.OS === 'web') window.alert(message); else Alert.alert('Quyền truy cập', message);
      return;
    }
    if (Platform.OS === 'web') {
      if (window.confirm(message)) void perform();
      return;
    }
    Alert.alert(title, message, [
      { text: 'Huỷ', style: 'cancel' },
      { text: kind === 'delete' ? 'Xoá' : 'Xác nhận', style: kind === 'delete' ? 'destructive' : 'default', onPress: () => { void perform(); } },
    ]);
  };

  return (
    <ScreenContainer>
      <TopNavbar />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={() => reloadPageOrRefresh(load)} tintColor={COLORS.primary} />}
      >
        <View style={[styles.content, { paddingHorizontal: pagePadding }]}>
          <View style={styles.heading}>
            <View style={styles.headingText}>
              <Text style={styles.eyebrow}>GÓC BẾP CỦA BẠN</Text>
              <Text style={styles.title}>Tủ thực phẩm</Text>
              <Text style={styles.subtitle}>Gọn gàng hơn, tươi ngon lâu hơn.</Text>
            </View>
            <View style={styles.headingIcon}><Ionicons name="leaf-outline" size={28} color={COLORS.primary} /></View>
          </View>

          {(households.length > 0 || context.ownerType === 'HOUSEHOLD') && (
            <View style={styles.contextToggle}>
              {(['USER', 'HOUSEHOLD'] as const).map((owner) => (
                <TouchableOpacity
                  key={owner}
                  disabled={owner === 'HOUSEHOLD' && households.length === 0}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: context.ownerType === owner }}
                  style={[styles.contextButton, context.ownerType === owner && styles.contextActive]}
                  onPress={() => { setActiveLocationFilter(null); dispatch(setInventoryContext(owner === 'USER' ? { ownerType: owner } : { ownerType: owner, householdId: households[0].household._id })); }}
                >
                  <Ionicons name={owner === 'USER' ? 'person-outline' : 'people-outline'} size={17} color={context.ownerType === owner ? COLORS.primary : COLORS.onSurfaceVariant} />
                  <Text style={[styles.contextText, context.ownerType === owner && { color: COLORS.primary }]}>{owner === 'USER' ? 'Cá nhân' : 'Gia đình'}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <View style={styles.overview}>
            <View style={styles.overviewTop}>
              <View style={styles.totalRow}>
                <Text style={styles.total}>{summary.total}</Text>
                <View><Text style={styles.totalLabel}>thực phẩm đang có</Text><Text style={styles.totalHint}>{context.ownerType === 'HOUSEHOLD' ? 'Trong tủ gia đình' : 'Trong tủ của bạn'}</Text></View>
              </View>
              <TouchableOpacity accessibilityRole="button" accessibilityState={{ selected: activeFilter === 'all' }} onPress={() => dispatch(setActiveFilter('all'))} style={styles.allButton}>
                <Text style={styles.allText}>Tất cả</Text><Ionicons name="arrow-forward" size={15} color={COLORS.primary} />
              </TouchableOpacity>
            </View>
            <View style={styles.statsGrid}>
              {FILTERS.map((filter) => (
                <TouchableOpacity
                  key={filter.key}
                  accessibilityRole="button"
                  accessibilityLabel={`${counts[filter.key]} thực phẩm ${filter.label.toLowerCase()}`}
                  accessibilityState={{ selected: activeFilter === filter.key }}
                  activeOpacity={0.75}
                  onPress={() => dispatch(setActiveFilter(activeFilter === filter.key ? 'all' : filter.key))}
                  style={[styles.stat, { width: contentWidth >= 700 ? '23.8%' : '48%' }, activeFilter === filter.key && styles.statActive]}
                >
                  <View style={[styles.statIcon, { backgroundColor: COLORS.alpha(filter.color, '18') }]}><Ionicons name={filter.icon} size={19} color={filter.color} /></View>
                  <View style={styles.statContent}><Text style={styles.statNumber}>{counts[filter.key]}</Text><Text style={styles.statLabel}>{filter.label}</Text></View>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.listHeading}>
            <View style={styles.headingText}>
              <Text style={styles.listTitle}>{activeFilter === 'all' ? 'Thực phẩm của bạn' : FILTERS.find((f) => f.key === activeFilter)?.label}</Text>
              <Text style={styles.listSubtitle}>{visibleCount} thực phẩm · Sắp xếp theo nơi bảo quản</Text>
            </View>
            <TouchableOpacity disabled={!canEdit} accessibilityRole="button" onPress={() => navigation.navigate('AddFood')} style={styles.addButton}>
              <Ionicons name="add" size={20} color={COLORS.onPrimary} /><Text style={styles.addText}>Thêm</Text>
            </TouchableOpacity>
          </View>

          {groupedItems.length > 1 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.locations}>
              {[{ key: null, name: 'Mọi vị trí' }, ...groupedItems.map(([key, group]) => ({ key, name: group.name }))].map((location) => (
                <TouchableOpacity key={location.key ?? 'all'} accessibilityRole="button" accessibilityState={{ selected: selectedLocation === location.key }} onPress={() => setActiveLocationFilter(location.key)} style={[styles.locationChip, selectedLocation === location.key && styles.locationActive]}>
                  <Text style={[styles.locationText, selectedLocation === location.key && { color: COLORS.primary }]}>{location.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {(error || syncError) && (
            <View style={styles.errorBanner}>
              <Ionicons name="cloud-offline-outline" size={22} color={COLORS.tertiary} />
              <Text style={styles.errorText}>{syncError || error}</Text>
              <TouchableOpacity accessibilityRole="button" onPress={load} style={styles.retry}><Text style={styles.retryText}>Thử lại</Text></TouchableOpacity>
            </View>
          )}

          {loading && items.length === 0 ? (
            <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} />
          ) : items.length === 0 && !error ? (
            <View style={styles.empty}>
              <View style={styles.emptyIcon}><Ionicons name={activeFilter === 'all' ? 'basket-outline' : 'checkmark-circle-outline'} size={36} color={COLORS.primary} /></View>
              <Text style={styles.emptyTitle}>{activeFilter === 'all' ? 'Tủ của bạn đang trống' : 'Không có thực phẩm ở trạng thái này'}</Text>
              <Text style={styles.emptySubtitle}>{activeFilter === 'all' ? 'Thêm những món đầu tiên để theo dõi độ tươi và hạn sử dụng.' : 'Chọn Tất cả để xem những món khác trong tủ.'}</Text>
              <TouchableOpacity disabled={activeFilter === 'all' && !canEdit} accessibilityRole="button" style={styles.emptyButton} onPress={() => activeFilter === 'all' ? navigation.navigate('AddFood') : dispatch(setActiveFilter('all'))}>
                <Text style={styles.allText}>{activeFilter === 'all' ? 'Thêm thực phẩm' : 'Xem tất cả'}</Text><Ionicons name="arrow-forward" size={16} color={COLORS.primary} />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.frames}>
              {visibleGroups.flatMap(([key, group]) => {
                const frames = splitFrames(group.items);
                return frames.map((frame, index) => {
                  const frameColumns = Math.min(columns, Math.max(2, frame.length));
                  const tileWidth = Math.floor((gridWidth - 12 * (frameColumns - 1)) / frameColumns);
                  const showAddTile = frameColumns === 2 && frame.length % 2 === 1;
                  return (
                  <View key={`${key}-${index}`} style={styles.frame}>
                    <View style={styles.frameHeader}>
                      <View style={styles.storageIcon}><Ionicons name={group.type ? STORAGE_ICONS[group.type] ?? 'cube-outline' : 'cube-outline'} size={20} color={COLORS.primary} /></View>
                      <View style={styles.headingText}>
                        <Text style={styles.storageName}>{group.name}</Text>
                        <Text style={styles.storageSubtitle}>{frames.length > 1 ? `Nhóm ${index + 1}/${frames.length} · ` : ''}{frame.length} thực phẩm</Text>
                      </View>
                      <View style={styles.frameCount}><Text style={styles.frameCountText}>{String(frame.length).padStart(2, '0')}</Text></View>
                    </View>
                    <View style={styles.foodGrid}>
                      {frame.map((item) => (
                        <View key={item._id} style={{ width: tileWidth }}>
                          <InventoryGridCard
                            item={item}
                            onPress={() => navigation.navigate('FoodDetail', { item })}
                            onEdit={() => { if (canEdit) navigation.navigate('UpdateFood', { item }); }}
                            onDelete={() => confirmAction(item, 'delete')}
                            onConsume={() => confirmAction(item, 'consume')}
                          />
                        </View>
                      ))}
                      {showAddTile && canEdit && (
                        <TouchableOpacity
                          accessibilityRole="button"
                          accessibilityLabel={`Thêm thực phẩm vào ${group.name}`}
                          activeOpacity={0.7}
                          style={[styles.addTile, { width: tileWidth }]}
                          onPress={() => navigation.navigate('AddFood', { prefill: {
                            storageLocationId: group.items[0].storageLocationId?._id,
                            storageTypeKey: group.type,
                            ownerType: context.ownerType,
                            householdId: context.householdId,
                          } })}
                        >
                          <View style={styles.addTileIcon}><Ionicons name="add" size={24} color={COLORS.primary} /></View>
                          <Text style={styles.addTileTitle}>Thêm thực phẩm</Text>
                          <Text style={styles.addTileHint}>{group.name}</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                  );
                });
              })}
            </View>
          )}
        </View>
      </ScrollView>
      <BottomNavbar />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: { flexGrow: 1, paddingBottom: 28 },
  content: { width: '100%', maxWidth: 1120, alignSelf: 'center', paddingTop: 24 },
  heading: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 22 },
  headingText: { flex: 1, minWidth: 0 },
  eyebrow: { fontSize: 10, fontWeight: '700', letterSpacing: 1.8, color: COLORS.primary, marginBottom: 7 },
  title: { fontSize: 29, lineHeight: 36, fontWeight: '800', letterSpacing: -0.8, color: COLORS.onSurface },
  subtitle: { fontSize: 13, lineHeight: 20, color: COLORS.onSurfaceVariant, marginTop: 4 },
  headingIcon: { width: 56, height: 56, borderRadius: 20, backgroundColor: COLORS.alpha(COLORS.primary, '04'), justifyContent: 'center', alignItems: 'center' },
  contextToggle: { flexDirection: 'row', backgroundColor: COLORS.surfaceContainer, padding: 4, borderRadius: 15, marginBottom: 16 },
  contextButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 44, borderRadius: 12 },
  contextActive: { backgroundColor: COLORS.surfaceContainerLowest },
  contextText: { fontSize: 13, fontWeight: '600', color: COLORS.onSurfaceVariant },
  overview: { padding: 16, borderRadius: 24, backgroundColor: COLORS.surfaceContainerLowest, borderWidth: 1, borderColor: COLORS.alpha(COLORS.outlineVariant, '40'), marginBottom: 26 },
  overviewTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 16 },
  totalRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  total: { fontSize: 38, lineHeight: 46, fontWeight: '800', letterSpacing: -1.5, color: COLORS.primary },
  totalLabel: { fontSize: 12, fontWeight: '600', color: COLORS.onSurface },
  totalHint: { fontSize: 10, color: COLORS.onSurfaceVariant, marginTop: 4 },
  allButton: { flexDirection: 'row', gap: 5, alignItems: 'center', minHeight: 44, paddingLeft: 8 },
  allText: { fontSize: 12, fontWeight: '700', color: COLORS.primary },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 10 },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 9, padding: 10, borderRadius: 14, borderWidth: 1, borderColor: 'transparent', backgroundColor: COLORS.background, minHeight: 70 },
  statActive: { borderColor: COLORS.primary, backgroundColor: COLORS.alpha(COLORS.primary, '04') },
  statIcon: { width: 33, height: 33, alignItems: 'center', justifyContent: 'center', borderRadius: 11 },
  statContent: { flex: 1 },
  statNumber: { fontSize: 21, fontWeight: '700', color: COLORS.onSurface },
  statLabel: { fontSize: 10, lineHeight: 15, color: COLORS.onSurfaceVariant, marginTop: 1 },
  listHeading: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  listTitle: { fontSize: 19, fontWeight: '700', letterSpacing: -0.3, color: COLORS.onSurface },
  listSubtitle: { fontSize: 11, lineHeight: 16, color: COLORS.onSurfaceVariant, marginTop: 4 },
  addButton: { flexDirection: 'row', alignItems: 'center', gap: 5, minHeight: 44, paddingHorizontal: 14, backgroundColor: COLORS.primary, borderRadius: 13 },
  addText: { fontSize: 12, fontWeight: '700', color: COLORS.onPrimary },
  locations: { gap: 8, paddingBottom: 16 },
  locationChip: { paddingHorizontal: 14, minHeight: 44, justifyContent: 'center', borderRadius: 12, backgroundColor: COLORS.surfaceContainerLowest, borderWidth: 1, borderColor: COLORS.alpha(COLORS.outlineVariant, '40') },
  locationActive: { backgroundColor: COLORS.alpha(COLORS.primary, '04'), borderColor: COLORS.primary },
  locationText: { fontSize: 12, fontWeight: '600', color: COLORS.onSurfaceVariant },
  frames: { gap: 18 },
  frame: { padding: 14, backgroundColor: COLORS.surfaceContainerLowest, borderRadius: 24, borderWidth: 1, borderColor: COLORS.alpha(COLORS.outlineVariant, '40') },
  frameHeader: { flexDirection: 'row', gap: 10, alignItems: 'center', paddingBottom: 16 },
  storageIcon: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.alpha(COLORS.primary, '04') },
  storageName: { fontSize: 16, fontWeight: '700', color: COLORS.onSurface },
  storageSubtitle: { fontSize: 10, color: COLORS.onSurfaceVariant, marginTop: 4 },
  frameCount: { backgroundColor: COLORS.surfaceContainer, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  frameCountText: { fontSize: 12, fontWeight: '700', color: COLORS.onSurfaceVariant },
  foodGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  addTile: { minHeight: 220, alignItems: 'center', justifyContent: 'center', padding: 12, gap: 8, borderRadius: 16, borderWidth: 1, borderStyle: 'dashed', borderColor: COLORS.alpha(COLORS.outlineVariant, '80'), backgroundColor: COLORS.alpha(COLORS.primary, '04') },
  addTileIcon: { width: 44, height: 44, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.surfaceContainerLowest },
  addTileTitle: { fontSize: 12, fontWeight: '600', color: COLORS.primary, textAlign: 'center' },
  addTileHint: { fontSize: 10, color: COLORS.onSurfaceVariant, textAlign: 'center' },
  loader: { marginVertical: 60 },
  empty: { paddingHorizontal: 24, paddingVertical: 36, alignItems: 'center', borderRadius: 24, backgroundColor: COLORS.surfaceContainerLowest },
  emptyIcon: { width: 72, height: 72, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.alpha(COLORS.primary, '04'), marginBottom: 18 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: COLORS.onSurface, textAlign: 'center' },
  emptySubtitle: { fontSize: 13, lineHeight: 21, color: COLORS.onSurfaceVariant, textAlign: 'center', marginTop: 8, maxWidth: 300 },
  emptyButton: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 18, minHeight: 48, marginTop: 16 },
  errorBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 16, backgroundColor: COLORS.alpha(COLORS.error, '18'), marginBottom: 16 },
  errorText: { flex: 1, fontSize: 12, lineHeight: 18, color: COLORS.onSurface },
  retry: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 6 },
  retryText: { fontSize: 12, fontWeight: '700', color: COLORS.tertiary },
});
