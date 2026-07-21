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
import { useAppDispatch, useAppSelector } from '../../../redux/hooks';
import { addFoodItem } from '../redux/inventorySlice';
import {
  createFoodApi,
  getFoodCategoriesApi,
  getStorageLocationsApi,
  getStorageSuggestionApi,
  createStorageLocationApi,
  uploadImageApi,
} from '../services/foodApi';
import { getMyHouseholdsApi } from '../../familyCloud/services/familyCloudApi';
import { MyHousehold } from '../../familyCloud/types/familyCloud';
import { FoodCategory, StorageLocation } from '../types/inventory';
import {
  getCategoryDisplayName,
  getFoodSaveAlert,
  sortFoodCategories,
} from '../utils/inventoryDisplay';

const SOURCE_TYPES = [
  { key: 'SUPERMARKET', label: 'Siêu thị' },
  { key: 'MARKET', label: 'Chợ' },
] as const;

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
  const context = useAppSelector((state: any) => state.inventory.context);

  const prefill = route.params?.prefill;

  const [categories, setCategories] = useState<FoodCategory[]>([]);
  const [locations, setLocations] = useState<StorageLocation[]>([]);
  const [suggestion, setSuggestion] = useState<string | null>(null);

  // Selector state
  const [households, setHouseholds] = useState<MyHousehold[]>([]);
  const [selectedContext, setSelectedContext] = useState<{ ownerType: 'USER' | 'HOUSEHOLD'; householdId?: string }>(context);

  const [form, setForm] = useState({
    foodName: prefill?.foodName ?? '',
    categoryId: prefill?.categoryId ?? '',
    storageLocationId: prefill?.storageLocationId ?? '',
    storageTypeKey: (prefill?.storageTypeKey ?? 'REFRIGERATOR') as string, // dùng khi chưa có location trong DB
    sourceType: (prefill?.sourceType ?? 'SUPERMARKET') as 'SUPERMARKET' | 'MARKET',
    expiryType: (prefill?.expiryType ?? 'MANUAL') as 'MANUAL' | 'SCANNED' | 'AI_PREDICTED',
    purchaseDate: new Date().toISOString().split('T')[0],
    expiryDate: prefill?.expiryDate ?? '',
    quantity: prefill?.quantity ?? '',
    unit: prefill?.unit ?? 'kg',
    imageUrl: prefill?.imageUrl ?? '',
  });

  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);

  useEffect(() => {
    Promise.all([
      getFoodCategoriesApi().catch(err => []),
      getStorageLocationsApi(selectedContext.ownerType, selectedContext.householdId).catch(err => []),
      getMyHouseholdsApi().catch(err => [])
    ])
      .then(([cats, locs, hhs]) => {
        setHouseholds(hhs);
        
        let newContext = selectedContext;
        if (hhs.length === 0 && selectedContext.ownerType === 'HOUSEHOLD') {
          newContext = { ownerType: 'USER' };
          setSelectedContext(newContext);
        }

        const catList = sortFoodCategories(cats);
        const prefillCategoryName = String(prefill?.categoryName || '').trim().toLowerCase();
        const matchedPrefillCategory = catList.find((cat) => cat._id === prefill?.categoryId)
          || catList.find((cat) =>
            [cat.categoryName, cat.displayName]
              .filter(Boolean)
              .some((name) => String(name).trim().toLowerCase() === prefillCategoryName)
          );
        const matchedPrefillLocation = locs.find((loc) => loc._id === prefill?.storageLocationId)
          || locs.find((loc) => loc.storageType === prefill?.storageTypeKey);

        setCategories(catList);
        setLocations(locs);
        setForm((f) => ({
          ...f,
          categoryId: matchedPrefillCategory?._id || f.categoryId || catList[0]?._id || '',
          storageLocationId: matchedPrefillLocation?._id || f.storageLocationId || locs[0]?._id || '',
          storageTypeKey: prefill?.storageTypeKey || matchedPrefillLocation?.storageType || f.storageTypeKey,
        }));
      })
      .finally(() => setFetchingData(false));
  }, [selectedContext]);

  // Gợi ý bảo quản khi đổi category (chỉ với real categoryId từ DB)
  useEffect(() => {
    if (!form.categoryId) {
      setSuggestion(null);
      return;
    }
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
    if (!categoryId) {
      Alert.alert('Chưa có danh mục', 'Admin cần tạo danh mục thực phẩm trong hệ thống trước khi thêm inventory.');
      return;
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

      // ── Upload image to Cloudinary if local URI ──────────────────────────────
      let imageUrl = form.imageUrl;
      if (imageUrl && imageUrl.startsWith('file://')) {
        try {
          const uploadResult = await uploadImageApi(imageUrl);
          imageUrl = uploadResult.url;
        } catch (uploadErr) {
          console.warn('[Upload image failed, using original URI]', uploadErr);
        }
      }

      // ── Nếu chưa có storage location → tự tạo ────────────────────────────
      let storageLocationId = form.storageLocationId;
      if (!storageLocationId) {
        const label = DEFAULT_STORAGES.find((s) => s.key === storageTypeKey)?.label ?? storageTypeKey;
        const created = await createStorageLocationApi({
          storageName: label.replace(/^\S+\s/, ''), // bỏ emoji
          storageType: storageTypeKey,
          isDefault: true,
        }, selectedContext.ownerType, selectedContext.householdId);
        storageLocationId = created._id;
        setLocations((prev) => [...prev, created]);
        setForm((f) => ({ ...f, storageLocationId: created._id }));
      }

      const newItem = await createFoodApi({
        foodName: foodName.trim(),
        categoryId,
        storageLocationId,
        imageUrl: imageUrl || undefined,
        sourceType: form.sourceType,
        expiryType: form.expiryType,
        purchaseDate: form.purchaseDate,
        expiryDate,
        quantity: Number(quantity),
        unit,
        nutritionSnapshot: prefill?.nutritionInfo ? {
          calories: Number(prefill.nutritionInfo.calories) || 0,
          protein: Number(prefill.nutritionInfo.protein) || 0,
          carbs: Number(prefill.nutritionInfo.carbs) || 0,
          fat: Number(prefill.nutritionInfo.fat) || 0,
          baseQuantity: 100,
          unit: 'g',
          source: 'SCAN_AI',
          confidence: Number(prefill.scanConfidence) || 0,
        } : undefined,
      }, selectedContext.ownerType, selectedContext.householdId);

      dispatch(addFoodItem(newItem));
      const saveAlert = getFoodSaveAlert(newItem);
      if (saveAlert) {
        Alert.alert(saveAlert.title, saveAlert.message, [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
        return;
      }

      Alert.alert('Thành công', `Đã thêm "${newItem.foodName}" vào tủ!`, [
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
        <TouchableOpacity onPress={() => navigation.navigate('Scanner')}>
          <MaterialIcons name="document-scanner" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

          {/* ── Nơi lưu (Context Selector) ── */}
          {households.length > 0 && (
            <View style={{ marginBottom: 16 }}>
              <Text style={styles.label}>Thêm vào kho</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                <TouchableOpacity
                  style={[
                    styles.contextChip,
                    selectedContext.ownerType === 'USER' && styles.contextChipActive
                  ]}
                  onPress={() => setSelectedContext({ ownerType: 'USER' })}
                >
                  <MaterialIcons name="person" size={16} color={selectedContext.ownerType === 'USER' ? COLORS.primary : COLORS.onSurfaceVariant} />
                  <Text style={[styles.contextChipText, selectedContext.ownerType === 'USER' && styles.contextChipTextActive]}>Cá nhân</Text>
                </TouchableOpacity>
                {households.map(hh => (
                  <TouchableOpacity
                    key={hh.household._id}
                    style={[
                      styles.contextChip,
                      selectedContext.householdId === hh.household._id && styles.contextChipActive
                    ]}
                    onPress={() => setSelectedContext({ ownerType: 'HOUSEHOLD', householdId: hh.household._id })}
                  >
                    <MaterialIcons name="groups" size={16} color={selectedContext.householdId === hh.household._id ? COLORS.primary : COLORS.onSurfaceVariant} />
                    <Text style={[styles.contextChipText, selectedContext.householdId === hh.household._id && styles.contextChipTextActive]}>{hh.household.householdName}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

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
                    }}
                  >
                    <Text style={[styles.chipText, form.categoryId === cat._id && styles.chipTextActive]}>
                      {getCategoryDisplayName(cat)}
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
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
            <View style={styles.chipRow}>
              {/* Existing locations */}
              {locations.map((loc) => (
                <TouchableOpacity
                  key={loc._id}
                  style={[styles.chip, form.storageLocationId === loc._id && styles.chipActive]}
                  onPress={() => setForm((f) => ({ ...f, storageLocationId: loc._id, storageTypeKey: '' }))}
                >
                  <Text style={[styles.chipText, form.storageLocationId === loc._id && styles.chipTextActive]}>
                    {loc.storageName}
                  </Text>
                </TouchableOpacity>
              ))}

              {/* Missing default locations (suggest to create) */}
              {DEFAULT_STORAGES.filter(
                (def) => !locations.some((loc) => loc.storageType === def.key)
              ).map((s) => (
                <TouchableOpacity
                  key={s.key}
                  style={[
                    styles.chip,
                    form.storageTypeKey === s.key && styles.chipActive,
                    { borderStyle: 'dashed' }
                  ]}
                  onPress={() => setForm((f) => ({ ...f, storageTypeKey: s.key, storageLocationId: '' }))}
                >
                  <Text style={[styles.chipText, form.storageTypeKey === s.key && styles.chipTextActive]}>
                    + {s.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

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
                placeholder="kg, g, ml, l, quả, cái..."
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
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.onSurfaceVariant,
    marginBottom: 6,
  },
  contextChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: COLORS.surfaceContainer,
    borderWidth: 1,
    borderColor: 'transparent',
    gap: 6,
  },
  contextChipActive: {
    backgroundColor: COLORS.surfaceContainerHighest,
    borderColor: COLORS.primary,
  },
  contextChipText: {
    fontSize: 14,
    color: COLORS.onSurfaceVariant,
    fontWeight: '500',
  },
  contextChipTextActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
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
