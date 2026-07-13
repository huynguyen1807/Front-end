import React, { useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, ActivityIndicator,
  RefreshControl, Platform, Alert, StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';

import BottomNavbar from '../../../components/layout/BottomNavbar';
import ScreenContainer from '../../../components/layout/ScreenContainer';
import TopNavbar from '../../../components/layout/TopNavbar';
import FilterChip from '../../../components/common/FilterChip';
import { COLORS } from '../../../constants/colors';
import { RADIUS } from '../../../constants/spacing';
import { useAppDispatch, useAppSelector } from '../../../redux/hooks';
import InventoryCard from '../components/InventoryCard';
import SummaryCard from '../components/SummaryCard';
import { fetchFoods, fetchSummary, setActiveFilter, deleteFood, consumeFood, setInventoryContext } from '../redux/inventorySlice';
import { InventoryFilter, FoodItem } from '../types/inventory';
import { getMyHouseholdsApi } from '../../familyCloud/services/familyCloudApi';
import { MyHousehold } from '../../familyCloud/types/familyCloud';

const FILTERS: { key: InventoryFilter; label: string; danger?: boolean }[] = [
  { key: 'all', label: 'Tất cả' },
  { key: 'SAFE', label: 'Còn tốt' },
  { key: 'NEAR_EXPIRY', label: 'Sắp hết hạn', danger: true },
  { key: 'EXPIRED', label: 'Hết hạn', danger: true },
  { key: 'NEED_CHECK', label: 'Cần kiểm tra', danger: true },
];

export default function InventoryDashboardScreen() {
  const dispatch = useAppDispatch();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();

  const { items, summary, activeFilter, loading, context } = useAppSelector((s) => s.inventory);
  const [households, setHouseholds] = React.useState<MyHousehold[]>([]);
  const [activeLocationFilter, setActiveLocationFilter] = React.useState<string | null>(null);

  React.useEffect(() => {
    getMyHouseholdsApi().then(setHouseholds).catch(console.error);
  }, []);

  const load = useCallback(() => {
    const filter = activeFilter === 'all' ? undefined : activeFilter as any;
    dispatch(fetchFoods(filter));
    dispatch(fetchSummary());
  }, [activeFilter, context, dispatch]);

  const groupedItems = React.useMemo(() => {
    const groups: Record<string, FoodItem[]> = {};
    items.forEach(item => {
      const locName = item.storageLocationId?.storageName || 'Chưa phân loại';
      if (!groups[locName]) groups[locName] = [];
      groups[locName].push(item);
    });
    // Sort groups alphabetically
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [items]);

  const uniqueLocations = React.useMemo(() => groupedItems.map(([locName]) => locName), [groupedItems]);

  const visibleGroups = React.useMemo(() => {
    if (!activeLocationFilter) return groupedItems;
    return groupedItems.filter(([locName]) => locName === activeLocationFilter);
  }, [groupedItems, activeLocationFilter]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleDelete = (item: FoodItem) => {
    Alert.alert('Xoá thực phẩm', `Xoá "${item.foodName}"?`, [
      { text: 'Huỷ', style: 'cancel' },
      {
        text: 'Xoá', style: 'destructive',
        onPress: () => dispatch(deleteFood(item._id)),
      },
    ]);
  };

  const handleConsume = (item: FoodItem) => {
    Alert.alert('Đánh dấu đã dùng', `Đã dùng hết "${item.foodName}"?`, [
      { text: 'Huỷ', style: 'cancel' },
      { text: 'Xác nhận', onPress: () => dispatch(consumeFood(item._id)) },
    ]);
  };

  const bottomSpace = Platform.OS === 'ios' ? 120 + insets.bottom : 120;
  const fabBottom = Platform.OS === 'ios' ? 92 + insets.bottom : 92;

  return (
    <ScreenContainer>
      <TopNavbar />

      {/* Context Toggle */}
      <View style={styles.contextToggleRow}>
        <View style={styles.contextToggleContainer}>
          <TouchableOpacity 
            style={[styles.contextToggleBtn, context.ownerType === 'USER' && styles.contextToggleBtnActive]}
            onPress={() => dispatch(setInventoryContext({ ownerType: 'USER' }))}
            activeOpacity={0.8}
          >
            <Ionicons name="person" size={14} color={context.ownerType === 'USER' ? COLORS.primary : COLORS.onSurfaceVariant} />
            <Text style={[styles.contextToggleText, context.ownerType === 'USER' && styles.contextToggleTextActive]}>Cá nhân</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.contextToggleBtn, context.ownerType === 'HOUSEHOLD' && styles.contextToggleBtnActive]}
            onPress={() => {
              if (households.length === 0) {
                Alert.alert('Chưa có gia đình', 'Bạn cần tạo hoặc tham gia một gia đình ở mục Family Cloud trước.');
                return;
              }
              dispatch(setInventoryContext({ ownerType: 'HOUSEHOLD', householdId: households[0].household._id }));
            }}
            activeOpacity={0.8}
          >
            <Ionicons name="home" size={14} color={context.ownerType === 'HOUSEHOLD' ? COLORS.primary : COLORS.onSurfaceVariant} />
            <Text style={[styles.contextToggleText, context.ownerType === 'HOUSEHOLD' && styles.contextToggleTextActive]}>Gia đình</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Summary row */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryBox}>
          <Text style={styles.summaryNum}>{summary.total}</Text>
          <Text style={styles.summaryLabel}>Tổng</Text>
        </View>
        <View style={[styles.summaryBox, styles.safeBox]}>
          <Text style={[styles.summaryNum, { color: COLORS.primary }]}>{summary.safe}</Text>
          <Text style={styles.summaryLabel}>Còn tốt</Text>
        </View>
        <View style={[styles.summaryBox, styles.warnBox]}>
          <Text style={[styles.summaryNum, { color: '#F59E0B' }]}>{summary.nearExpiry}</Text>
          <Text style={styles.summaryLabel}>Sắp hết</Text>
        </View>
        <View style={[styles.summaryBox, styles.dangerBox]}>
          <Text style={[styles.summaryNum, { color: COLORS.tertiary }]}>{summary.expired}</Text>
          <Text style={styles.summaryLabel}>Hết hạn</Text>
        </View>
        <View style={[styles.summaryBox, styles.checkBox]}>
          <Text style={[styles.summaryNum, { color: COLORS.onSurfaceVariant }]}>{summary.needCheck ?? 0}</Text>
          <Text style={styles.summaryLabel}>Cần kiểm tra</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: bottomSpace }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
      >
        {/* Filter chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {FILTERS.map((f) => (
            <FilterChip
              key={f.key}
              label={f.label}
              danger={f.danger}
              active={activeFilter === f.key}
              onPress={() => dispatch(setActiveFilter(f.key))}
            />
          ))}
        </ScrollView>
        


        {/* Content */}
        {loading && items.length === 0 ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
        ) : items.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="basket-outline" size={64} color={COLORS.primary} />
            <Text style={styles.emptyText}>Chưa có thực phẩm nào</Text>
            <Text style={styles.emptySubText}>Nhấn + để thêm thực phẩm vào tủ</Text>
          </View>
        ) : visibleGroups.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="filter-outline" size={64} color={COLORS.onSurfaceVariant} />
            <Text style={styles.emptyText}>Không có mục nào ở đây</Text>
          </View>
        ) : (
          <View style={styles.cardList}>
            {visibleGroups.map(([locName, groupItems]) => (
              <View key={locName} style={styles.sectionContainer}>
                <TouchableOpacity 
                  activeOpacity={0.7} 
                  style={[styles.sectionHeader, activeLocationFilter === locName && styles.sectionHeaderActive]} 
                  onPress={() => setActiveLocationFilter(activeLocationFilter === locName ? null : locName)}
                >
                  <Ionicons name="location" size={18} color={activeLocationFilter === locName ? COLORS.primary : COLORS.onSurfaceVariant} />
                  <Text style={[styles.sectionTitle, activeLocationFilter === locName && { color: COLORS.primary }]}>{locName}</Text>
                  <View style={[styles.sectionBadge, activeLocationFilter === locName && { backgroundColor: COLORS.primary }]}>
                    <Text style={[styles.sectionBadgeText, activeLocationFilter === locName && { color: COLORS.onPrimary }]}>{groupItems.length}</Text>
                  </View>
                </TouchableOpacity>
                {groupItems.map((item) => (
                  <InventoryCard
                    key={item._id}
                    item={item}
                    onPress={() => navigation.navigate('FoodDetail', { item })}
                    onEdit={() => navigation.navigate('UpdateFood', { item })}
                    onDelete={() => handleDelete(item)}
                    onConsume={() => handleConsume(item)}
                  />
                ))}
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* FAB - Add food */}
      <TouchableOpacity
        activeOpacity={0.85}
        style={[styles.fab, { bottom: fabBottom }]}
        onPress={() => navigation.navigate('AddFood')}
      >
        <Ionicons name="add" size={34} color={COLORS.onPrimary} />
      </TouchableOpacity>

      <BottomNavbar />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  contextToggleRow: {
    paddingHorizontal: 16,
    paddingTop: 8,
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
  summaryRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  summaryBox: {
    flex: 1,
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(189,202,191,0.35)',
  },
  safeBox: { borderColor: 'rgba(34,197,94,0.3)' },
  warnBox: { borderColor: 'rgba(245,158,11,0.3)' },
  dangerBox: { borderColor: 'rgba(239,68,68,0.3)' },
  checkBox: { borderColor: 'rgba(100,116,139,0.35)' },
  summaryNum: { fontSize: 20, fontWeight: '800', color: COLORS.onSurface },
  summaryLabel: { fontSize: 11, color: COLORS.onSurfaceVariant, marginTop: 2 },
  chipRow: { paddingHorizontal: 16, paddingBottom: 8, gap: 8 },
  cardList: { paddingHorizontal: 16, gap: 12, paddingTop: 4 },
  sectionContainer: {
    marginBottom: 8,
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    marginTop: 8,
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: RADIUS.md,
  },
  sectionHeaderActive: {
    backgroundColor: COLORS.surfaceContainerHighest,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.onSurface,
    flex: 1,
  },
  sectionBadge: {
    backgroundColor: COLORS.surfaceContainerHighest,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  sectionBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.onSurfaceVariant,
  },
  empty: { alignItems: 'center', marginTop: 80, paddingHorizontal: 32 },
  emptyText: { fontSize: 18, fontWeight: '700', color: COLORS.onSurface, marginTop: 16 },
  emptySubText: { fontSize: 14, color: COLORS.onSurfaceVariant, marginTop: 8, textAlign: 'center' },
  fab: {
    position: 'absolute',
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
});
