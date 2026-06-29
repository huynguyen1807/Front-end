import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Alert,
  ActivityIndicator, StyleSheet, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';

import { COLORS } from '../../../constants/colors';
import {
  getStorageLocationsApi,
  createStorageLocationApi,
  deleteStorageLocationApi,
} from '../services/foodApi';
import { StorageLocation } from '../types/inventory';

const STORAGE_TYPES = [
  { key: 'REFRIGERATOR', label: 'Tủ lạnh', icon: 'kitchen' },
  { key: 'FREEZER', label: 'Ngăn đông', icon: 'ac-unit' },
  { key: 'PANTRY', label: 'Tủ khô', icon: 'inventory-2' },
  { key: 'OUTSIDE', label: 'Ngoài trời', icon: 'wb-sunny' },
  { key: 'KITCHEN_CABINET', label: 'Tủ bếp', icon: 'kitchen' },
  { key: 'CUSTOM', label: 'Khác', icon: 'place' },
] as const;

export default function StorageLocationScreen() {
  const navigation = useNavigation<any>();
  const [locations, setLocations] = useState<StorageLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    storageName: '',
    storageType: 'REFRIGERATOR' as string,
    description: '',
    isDefault: false,
  });

  const load = async () => {
    setLoading(true);
    try {
      const locs = await getStorageLocationsApi();
      setLocations(locs);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async () => {
    if (!form.storageName.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập tên vị trí lưu trữ');
      return;
    }
    try {
      setAdding(true);
      const loc = await createStorageLocationApi(form);
      setLocations((prev) => [...prev, loc]);
      setForm({ storageName: '', storageType: 'REFRIGERATOR', description: '', isDefault: false });
      setShowForm(false);
    } catch (err: any) {
      Alert.alert('Lỗi', err.response?.data?.message || err.message);
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = (loc: StorageLocation) => {
    Alert.alert('Xoá vị trí', `Xoá "${loc.storageName}"?`, [
      { text: 'Huỷ', style: 'cancel' },
      {
        text: 'Xoá', style: 'destructive',
        onPress: async () => {
          try {
            await deleteStorageLocationApi(loc._id);
            setLocations((prev) => prev.filter((l) => l._id !== loc._id));
          } catch (err: any) {
            Alert.alert('Không thể xoá', err.response?.data?.message || err.message);
          }
        },
      },
    ]);
  };

  const getTypeLabel = (type: string) =>
    STORAGE_TYPES.find((t) => t.key === type)?.label ?? type;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color={COLORS.onSurface} />
        </TouchableOpacity>
        <Text style={styles.title}>Vị trí lưu trữ</Text>
        <TouchableOpacity onPress={() => setShowForm((v) => !v)}>
          <MaterialIcons name={showForm ? 'close' : 'add'} size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Add form */}
        {showForm && (
          <View style={styles.formBox}>
            <Text style={styles.label}>Tên vị trí *</Text>
            <TextInput
              style={styles.input}
              placeholder="VD: Tủ lạnh phòng bếp"
              value={form.storageName}
              onChangeText={(v) => setForm((f) => ({ ...f, storageName: v }))}
            />

            <Text style={styles.label}>Loại</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.chipRow}>
                {STORAGE_TYPES.map((t) => (
                  <TouchableOpacity
                    key={t.key}
                    style={[styles.chip, form.storageType === t.key && styles.chipActive]}
                    onPress={() => setForm((f) => ({ ...f, storageType: t.key }))}
                  >
                    <Text style={[styles.chipText, form.storageType === t.key && styles.chipTextActive]}>
                      {t.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <Text style={[styles.label, { marginTop: 12 }]}>Ghi chú</Text>
            <TextInput
              style={styles.input}
              placeholder="Tuỳ chọn"
              value={form.description}
              onChangeText={(v) => setForm((f) => ({ ...f, description: v }))}
            />

            <TouchableOpacity
              style={[styles.addBtn, adding && { opacity: 0.6 }]}
              onPress={handleAdd}
              disabled={adding}
            >
              {adding
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.addBtnText}>Thêm vị trí</Text>
              }
            </TouchableOpacity>
          </View>
        )}

        {/* List */}
        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
        ) : locations.length === 0 ? (
          <View style={styles.empty}>
            <MaterialIcons name="inventory-2" size={56} color={COLORS.primary} />
            <Text style={styles.emptyText}>Chưa có vị trí lưu trữ</Text>
            <Text style={styles.emptySubText}>Nhấn + để thêm</Text>
          </View>
        ) : (
          locations.map((loc) => (
            <View key={loc._id} style={styles.locCard}>
              <View style={styles.locInfo}>
                <Text style={styles.locName}>{loc.storageName}</Text>
                <Text style={styles.locType}>{getTypeLabel(loc.storageType)}</Text>
                {loc.isDefault && (
                  <View style={styles.defaultBadge}>
                    <Text style={styles.defaultText}>Mặc định</Text>
                  </View>
                )}
              </View>
              <TouchableOpacity onPress={() => handleDelete(loc)} style={styles.deleteBtn}>
                <MaterialIcons name="delete-outline" size={22} color={COLORS.tertiary} />
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.surface },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: COLORS.outlineVariant,
  },
  title: { fontSize: 18, fontWeight: '700', color: COLORS.onSurface },
  content: { padding: 16, gap: 12, paddingBottom: 40 },
  formBox: {
    backgroundColor: COLORS.surfaceContainerHigh, borderRadius: 16,
    padding: 16, marginBottom: 8,
    borderWidth: 1, borderColor: COLORS.outlineVariant,
  },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.onSurface, marginBottom: 6 },
  input: {
    backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.outlineVariant,
    borderRadius: 10, paddingHorizontal: 14, height: 46,
    fontSize: 14, color: COLORS.onSurface, marginBottom: 4,
  },
  chipRow: { flexDirection: 'row', gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
    borderWidth: 1, borderColor: COLORS.outlineVariant,
    backgroundColor: COLORS.surface,
  },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontSize: 12, color: COLORS.onSurfaceVariant, fontWeight: '600' },
  chipTextActive: { color: '#fff' },
  addBtn: {
    backgroundColor: COLORS.primary, height: 46, borderRadius: 23,
    justifyContent: 'center', alignItems: 'center', marginTop: 12,
  },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  locCard: {
    backgroundColor: COLORS.surfaceContainerLowest, borderRadius: 14, padding: 16,
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(189,202,191,0.35)',
  },
  locInfo: { flex: 1 },
  locName: { fontSize: 15, fontWeight: '700', color: COLORS.onSurface },
  locType: { fontSize: 13, color: COLORS.onSurfaceVariant, marginTop: 2 },
  defaultBadge: {
    marginTop: 6, alignSelf: 'flex-start',
    backgroundColor: COLORS.primary + '20', paddingHorizontal: 10, paddingVertical: 3,
    borderRadius: 10,
  },
  defaultText: { fontSize: 11, color: COLORS.primary, fontWeight: '700' },
  deleteBtn: { padding: 8 },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { fontSize: 17, fontWeight: '700', color: COLORS.onSurface, marginTop: 12 },
  emptySubText: { fontSize: 13, color: COLORS.onSurfaceVariant, marginTop: 6 },
});
