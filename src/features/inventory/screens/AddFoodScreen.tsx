import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  Alert, ActivityIndicator, StyleSheet, Image, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import { COLORS } from '../../../constants/colors';
import { useAppDispatch } from '../../../redux/hooks';
import { addFoodItem } from '../redux/inventorySlice';
import {
  createFoodApi,
  getFoodCategoriesApi,
  getStorageLocationsApi,
  getStorageSuggestionApi,
  createStorageLocationApi,
} from '../services/foodApi';
import { FoodCategory, StorageLocation } from '../types/inventory';

const SOURCE_TYPES = [
  { key: 'SUPERMARKET', label: 'Siêu thị' },
  { key: 'MARKET', label: 'Chợ' },
] as const;

// Danh mục mặc định nếu DB chưa có seed
const DEFAULT_CATEGORIES: FoodCategory[] = [
  { _id: '__thit', categoryName: 'Thịt & Hải sản' },
  { _id: '__rau', categoryName: 'Rau củ quả' },
  { _id: '__sua', categoryName: 'Sữa & Trứng' },
  { _id: '__do_kho', categoryName: 'Đồ khô' },
  { _id: '__nuoc', categoryName: 'Đồ uống' },
  { _id: '__khac', categoryName: 'Khác' },
];

// Storage mặc định nếu user chưa tạo
const DEFAULT_STORAGES = [
  { key: 'REFRIGERATOR', label: '🧊 Tủ lạnh' },
  { key: 'FREEZER', label: '❄️ Ngăn đông' },
  { key: 'PANTRY', label: '🗄️ Tủ khô' },
  { key: 'OUTSIDE', label: '🌤️ Ngoài trời' },
] as const;

export default function AddFoodScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const dispatch = useAppDispatch();

  const prefill = route.params?.prefill;

  const [categories, setCategories] = useState<FoodCategory[]>([]);
  const [locations, setLocations] = useState<StorageLocation[]>([]);
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [selectedCategoryName, setSelectedCategoryName] = useState('');

  const [form, setForm] = useState({
    foodName: prefill?.foodName ?? '',
    categoryId: '',
    storageLocationId: '',
    storageTypeKey: 'REFRIGERATOR' as string, // dùng khi chưa có location trong DB
    sourceType: (prefill?.sourceType ?? 'SUPERMARKET') as 'SUPERMARKET' | 'MARKET',
    expiryType: (prefill?.expiryType ?? 'MANUAL') as 'MANUAL' | 'SCANNED' | 'AI_PREDICTED',
    purchaseDate: new Date().toISOString().split('T')[0],
    expiryDate: prefill?.expiryDate ?? '',
    quantity: prefill?.quantity ?? '',
    unit: 'kg',
    imageUrl: prefill?.imageUrl ?? '',
  });

  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);

  useEffect(() => {
    Promise.all([getFoodCategoriesApi(), getStorageLocationsApi()])
      .then(([cats, locs]) => {
        // Nếu DB có category → dùng DB, không thì dùng mặc định
        const catList = cats.length > 0 ? cats : DEFAULT_CATEGORIES;
        setCategories(catList);
        setLocations(locs);
        setForm((f) => ({
          ...f,
          categoryId: catList[0]._id,
        }));
        setSelectedCategoryName(catList[0].categoryName);
        if (locs.length) {
          setForm((f) => ({ ...f, storageLocationId: locs[0]._id }));
        }
      })
      .catch(() => {
        // Nếu API lỗi, vẫn hiện danh mục mặc định
        setCategories(DEFAULT_CATEGORIES);
        setForm((f) => ({ ...f, categoryId: DEFAULT_CATEGORIES[0]._id }));
        setSelectedCategoryName(DEFAULT_CATEGORIES[0].categoryName);
      })
      .finally(() => setFetchingData(false));
  }, []);

  // Gợi ý bảo quản khi đổi category (chỉ với real categoryId từ DB)
  useEffect(() => {
    if (!form.categoryId || form.categoryId.startsWith('__')) return;
    getStorageSuggestionApi(form.categoryId)
      .then((s) => setSuggestion(s?.instruction ?? null))
      .catch(() => setSuggestion(null));
  }, [form.categoryId]);

  // ─── Image Picker ────────────────────────────────────────────────────────────
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Cần quyền', 'Vui lòng cho phép truy cập thư viện ảnh');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled) {
      setForm((f) => ({ ...f, imageUrl: result.assets[0].uri }));
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Cần quyền', 'Vui lòng cho phép truy cập camera');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled) {
      setForm((f) => ({ ...f, imageUrl: result.assets[0].uri }));
    }
  };

  const showImageOptions = () => {
    Alert.alert('Thêm ảnh', 'Chọn nguồn ảnh', [
      { text: 'Chụp ảnh', onPress: takePhoto },
      { text: 'Chọn từ thư viện', onPress: pickImage },
      { text: 'Huỷ', style: 'cancel' },
    ]);
  };

  // ─── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    const { foodName, categoryId, purchaseDate, expiryDate, quantity, unit, storageTypeKey } = form;

    if (!foodName.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập tên thực phẩm'); return;
    }
    if (!expiryDate) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập ngày hết hạn'); return;
    }
    if (!quantity) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập số lượng'); return;
    }

    if (purchaseDate && expiryDate) {
      const pDate = new Date(purchaseDate);
      const eDate = new Date(expiryDate);
      if (eDate < pDate) {
        Alert.alert('Lỗi', 'Ngày hết hạn không được trước ngày mua'); return;
      }
    }

    try {
      setLoading(true);

      // ── Nếu chưa có storage location → tự tạo ────────────────────────────
      let storageLocationId = form.storageLocationId;
      if (!storageLocationId) {
        const label = DEFAULT_STORAGES.find((s) => s.key === storageTypeKey)?.label ?? storageTypeKey;
        const created = await createStorageLocationApi({
          storageName: label.replace(/^\S+\s/, ''), // bỏ emoji
          storageType: storageTypeKey,
          isDefault: true,
        });
        storageLocationId = created._id;
        setLocations((prev) => [...prev, created]);
        setForm((f) => ({ ...f, storageLocationId: created._id }));
      }

      // ── Nếu category là mock (chưa có DB) → skip categoryId hoặc dùng placeholder ─
      // Backend vẫn cần categoryId hợp lệ → nếu là mock ID, ta tạo category tạm
      let finalCategoryId = categoryId;
      if (categoryId.startsWith('__')) {
        // Thử tạo category nếu chưa tồn tại (backend có thể đã có)
        try {
          const res = await fetch(`${require('../../../config/env').getApiUrl()}/api/foods/categories`, {
            headers: { 'Content-Type': 'application/json' }
          });
          // Nếu không tìm được category phù hợp, dùng category đầu tiên thực sự có trong DB
          // hoặc skip → backend sẽ báo lỗi rõ hơn
          const data = await res.json();
          if (data.data?.length) finalCategoryId = data.data[0]._id;
        } catch (_) {}
      }

      if (!finalCategoryId || finalCategoryId.startsWith('__')) {
        Alert.alert(
          'Chưa có danh mục',
          'Admin chưa tạo danh mục thực phẩm trong hệ thống. Vui lòng liên hệ Member 4 để seed dữ liệu.',
          [{ text: 'OK' }]
        );
        setLoading(false);
        return;
      }

      const newItem = await createFoodApi({
        foodName: foodName.trim(),
        categoryId: finalCategoryId,
        storageLocationId,
        imageUrl: form.imageUrl || undefined,
        sourceType: form.sourceType,
        expiryType: form.expiryType,
        purchaseDate: form.purchaseDate,
        expiryDate,
        quantity: Number(quantity),
        unit,
      });

      dispatch(addFoodItem(newItem));
      Alert.alert('✅ Thành công', `Đã thêm "${newItem.foodName}" vào tủ!`, [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Không thêm được thực phẩm';
      Alert.alert('Lỗi', msg);
    } finally {
      setLoading(false);
    }
  };

  if (fetchingData) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={{ color: COLORS.onSurfaceVariant, marginTop: 12 }}>Đang tải dữ liệu...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color={COLORS.onSurface} />
        </TouchableOpacity>
        <Text style={styles.title}>Thêm thực phẩm</Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        {/* ── Ảnh ── */}
        <TouchableOpacity style={styles.imagePicker} onPress={showImageOptions}>
          {form.imageUrl ? (
            <Image source={{ uri: form.imageUrl }} style={styles.imagePreview} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <MaterialIcons name="add-a-photo" size={36} color={COLORS.primary} />
              <Text style={styles.imageHint}>Thêm ảnh (tuỳ chọn)</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* ── Tên ── */}
        <Text style={styles.label}>Tên thực phẩm *</Text>
        <TextInput
          style={styles.input}
          placeholder="VD: Thịt bò, Rau cải..."
          placeholderTextColor={COLORS.onSurfaceVariant + '80'}
          value={form.foodName}
          onChangeText={(v) => setForm((f) => ({ ...f, foodName: v }))}
        />

        {/* ── Danh mục ── */}
        <Text style={styles.label}>Danh mục *</Text>
        {categories.length === 0 ? (
          <Text style={styles.hint}>⚠️ Chưa có danh mục – Admin cần seed dữ liệu</Text>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
            <View style={styles.chipRow}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat._id}
                  style={[styles.chip, form.categoryId === cat._id && styles.chipActive]}
                  onPress={() => {
                    setForm((f) => ({ ...f, categoryId: cat._id }));
                    setSelectedCategoryName(cat.categoryName);
                  }}
                >
                  <Text style={[styles.chipText, form.categoryId === cat._id && styles.chipTextActive]}>
                    {cat.categoryName}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        )}

        {suggestion && (
          <View style={styles.suggestionBox}>
            <MaterialIcons name="lightbulb" size={16} color="#F59E0B" />
            <Text style={styles.suggestionText}>{suggestion}</Text>
          </View>
        )}

        {/* ── Vị trí lưu trữ ── */}
        <Text style={styles.label}>Vị trí lưu trữ *</Text>
        {locations.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
            <View style={styles.chipRow}>
              {locations.map((loc) => (
                <TouchableOpacity
                  key={loc._id}
                  style={[styles.chip, form.storageLocationId === loc._id && styles.chipActive]}
                  onPress={() => setForm((f) => ({ ...f, storageLocationId: loc._id }))}
                >
                  <Text style={[styles.chipText, form.storageLocationId === loc._id && styles.chipTextActive]}>
                    {loc.storageName}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        ) : (
          <>
            <Text style={styles.hint}>Chưa có vị trí – chọn loại để tự động tạo:</Text>
            <View style={[styles.chipRow, { marginBottom: 16 }]}>
              {DEFAULT_STORAGES.map((s) => (
                <TouchableOpacity
                  key={s.key}
                  style={[styles.chip, form.storageTypeKey === s.key && styles.chipActive]}
                  onPress={() => setForm((f) => ({ ...f, storageTypeKey: s.key, storageLocationId: '' }))}
                >
                  <Text style={[styles.chipText, form.storageTypeKey === s.key && styles.chipTextActive]}>
                    {s.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {/* ── Số lượng + Đơn vị ── */}
        <View style={styles.row}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={styles.label}>Số lượng *</Text>
            <TextInput
              style={styles.input}
              placeholder="1"
              keyboardType="numeric"
              value={form.quantity}
              onChangeText={(v) => setForm((f) => ({ ...f, quantity: v }))}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Đơn vị</Text>
            <TextInput
              style={styles.input}
              placeholder="kg, cái, túi..."
              value={form.unit}
              onChangeText={(v) => setForm((f) => ({ ...f, unit: v }))}
            />
          </View>
        </View>

        {/* ── Nguồn gốc ── */}
        <Text style={styles.label}>Nguồn gốc</Text>
        <View style={[styles.chipRow, { marginBottom: 16 }]}>
          {SOURCE_TYPES.map((s) => (
            <TouchableOpacity
              key={s.key}
              style={[styles.chip, form.sourceType === s.key && styles.chipActive]}
              onPress={() => setForm((f) => ({ ...f, sourceType: s.key }))}
            >
              <Text style={[styles.chipText, form.sourceType === s.key && styles.chipTextActive]}>
                {s.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Ngày mua ── */}
        <Text style={styles.label}>Ngày mua</Text>
        <TextInput
          style={styles.input}
          placeholder="YYYY-MM-DD"
          value={form.purchaseDate}
          onChangeText={(v) => setForm((f) => ({ ...f, purchaseDate: v }))}
        />

        {/* ── Ngày hết hạn ── */}
        <Text style={styles.label}>Ngày hết hạn *</Text>
        <TextInput
          style={styles.input}
          placeholder="YYYY-MM-DD"
          value={form.expiryDate}
          onChangeText={(v) => setForm((f) => ({ ...f, expiryDate: v }))}
        />

        {/* ── Submit ── */}
        <TouchableOpacity
          style={[styles.button, loading && { opacity: 0.6 }]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.buttonText}>Thêm thực phẩm</Text>
          }
        </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.surface },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.surface },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: COLORS.outlineVariant,
  },
  title: { fontSize: 18, fontWeight: '700', color: COLORS.onSurface },
  content: { padding: 16, paddingBottom: 48 },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.onSurface, marginBottom: 6, marginTop: 4 },
  hint: { fontSize: 12, color: COLORS.onSurfaceVariant, marginBottom: 12, fontStyle: 'italic' },
  input: {
    backgroundColor: COLORS.surfaceContainer, borderWidth: 1, borderColor: COLORS.outlineVariant,
    borderRadius: 10, paddingHorizontal: 14, height: 48,
    fontSize: 15, color: COLORS.onSurface, marginBottom: 16,
  },
  row: { flexDirection: 'row' },
  chipRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1, borderColor: COLORS.outlineVariant,
    backgroundColor: COLORS.surfaceContainer,
  },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontSize: 13, color: COLORS.onSurfaceVariant, fontWeight: '600' },
  chipTextActive: { color: '#fff' },
  suggestionBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: '#FEF3C7', borderRadius: 10, padding: 12, marginBottom: 16,
  },
  suggestionText: { flex: 1, fontSize: 13, color: '#92400E' },
  // Image picker
  imagePicker: {
    height: 140, borderRadius: 14, marginBottom: 20,
    borderWidth: 2, borderColor: COLORS.outlineVariant, borderStyle: 'dashed',
    overflow: 'hidden',
  },
  imagePreview: { width: '100%', height: '100%' },
  imagePlaceholder: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    backgroundColor: COLORS.surfaceContainer, gap: 8,
  },
  imageHint: { fontSize: 13, color: COLORS.primary, fontWeight: '600' },
  button: {
    backgroundColor: COLORS.primary, height: 54, borderRadius: 27,
    justifyContent: 'center', alignItems: 'center', marginTop: 8,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
