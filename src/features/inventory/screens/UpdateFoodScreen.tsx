import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { MaterialIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";

import { COLORS } from "../../../constants/colors";
import { useAppDispatch } from "../../../redux/hooks";
import { updateFoodItem } from "../redux/inventorySlice";
import {
  getFoodCategoriesApi,
  getStorageLocationsApi,
  updateFoodApi,
  uploadImageApi,
} from "../services/foodApi";
import { FoodCategory, FoodItem, StorageLocation } from "../types/inventory";
import {
  getCategoryDisplayName,
  getFoodSaveAlert,
  sortFoodCategories,
} from "../utils/inventoryDisplay";

const SOURCE_TYPES = [
  { key: "SUPERMARKET", label: "Siêu thị" },
  { key: "MARKET", label: "Chợ" },
] as const;

const EXPIRY_TYPES = [
  { key: "MANUAL", label: "Thủ công" },
  { key: "SCANNED", label: "Scan" },
  { key: "AI_PREDICTED", label: "AI dự đoán" },
] as const;

function toDateInput(value?: string) {
  return value ? value.split("T")[0] : "";
}

export default function UpdateFoodScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const dispatch = useAppDispatch();

  const item: FoodItem = route.params?.item;

  const [categories, setCategories] = useState<FoodCategory[]>([]);
  const [locations, setLocations] = useState<StorageLocation[]>([]);
  const [form, setForm] = useState({
    foodName: item?.foodName ?? "",
    categoryId: item?.categoryId?._id ?? "",
    storageLocationId: item?.storageLocationId?._id ?? "",
    sourceType: (item?.sourceType ?? "SUPERMARKET") as "SUPERMARKET" | "MARKET",
    expiryType: (item?.expiryType ?? "MANUAL") as "MANUAL" | "SCANNED" | "AI_PREDICTED",
    purchaseDate: toDateInput(item?.purchaseDate),
    expiryDate: toDateInput(item?.expiryDate),
    quantity: String(item?.quantity ?? ""),
    unit: item?.unit ?? "kg",
    imageUrl: item?.imageUrl ?? "",
  });

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    Promise.all([getFoodCategoriesApi(), getStorageLocationsApi()])
      .then(([categoryList, locationList]) => {
        const sortedCategories = sortFoodCategories(categoryList);
        setCategories(sortedCategories);
        setLocations(locationList);
        setForm((current) => ({
          ...current,
          categoryId: current.categoryId || sortedCategories[0]?._id || "",
          storageLocationId: current.storageLocationId || locationList[0]?._id || "",
        }));
      })
      .catch(() => {
        Alert.alert("Không tải được dữ liệu", "Không thể tải category hoặc vị trí lưu trữ.");
      })
      .finally(() => setFetching(false));
  }, []);

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Cần quyền", "Vui lòng cho phép truy cập thư viện ảnh.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.78,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      setForm((current) => ({ ...current, imageUrl: result.assets[0].uri }));
    }
  };

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Cần quyền", "Vui lòng cho phép truy cập camera.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.78,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      setForm((current) => ({ ...current, imageUrl: result.assets[0].uri }));
    }
  };

  const handleSave = async () => {
    if (!form.foodName.trim() || !form.categoryId || !form.storageLocationId) {
      Alert.alert("Thiếu thông tin", "Vui lòng nhập tên, danh mục và vị trí lưu trữ.");
      return;
    }

    if (!form.quantity || Number(form.quantity) < 0 || !form.unit.trim()) {
      Alert.alert("Thiếu số lượng", "Vui lòng nhập số lượng và đơn vị hợp lệ.");
      return;
    }

    if (!form.purchaseDate || !form.expiryDate) {
      Alert.alert("Thiếu ngày", "Vui lòng nhập ngày mua và ngày hết hạn.");
      return;
    }

    if (new Date(form.expiryDate) < new Date(form.purchaseDate)) {
      Alert.alert("Ngày không hợp lệ", "Ngày hết hạn không được trước ngày mua.");
      return;
    }

    try {
      setLoading(true);

      // Upload image to Cloudinary if local URI
      let imageUrl = form.imageUrl;
      if (imageUrl && imageUrl.startsWith('file://')) {
        try {
          const uploadResult = await uploadImageApi(imageUrl);
          imageUrl = uploadResult.url;
        } catch (uploadErr) {
          console.warn('[Upload image failed, using original URI]', uploadErr);
        }
      }

      const updated = await updateFoodApi(item._id, {
        foodName: form.foodName.trim(),
        categoryId: form.categoryId,
        storageLocationId: form.storageLocationId,
        sourceType: form.sourceType,
        expiryType: form.expiryType,
        purchaseDate: form.purchaseDate,
        expiryDate: form.expiryDate,
        quantity: Number(form.quantity),
        unit: form.unit.trim(),
        imageUrl: imageUrl,
      });

      dispatch(updateFoodItem(updated));
      const saveAlert = getFoodSaveAlert(updated);
      if (saveAlert) {
        Alert.alert(saveAlert.title, saveAlert.message, [
          { text: "OK", onPress: () => navigation.goBack() },
        ]);
        return;
      }

      Alert.alert("Đã cập nhật", `"${updated.foodName}" đã được lưu.`, [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      Alert.alert("Không lưu được", error.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator color={COLORS.primary} size="large" />
        <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color={COLORS.onSurface} />
        </TouchableOpacity>
        <Text style={styles.title}>Sửa thực phẩm</Text>
        <TouchableOpacity onPress={handleSave} disabled={loading}>
          <MaterialIcons name="check" size={25} color={loading ? COLORS.outlineVariant : COLORS.primary} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <TouchableOpacity style={styles.imagePicker} activeOpacity={0.86} onPress={pickImage}>
            {form.imageUrl ? (
              <Image source={{ uri: form.imageUrl }} style={styles.imagePreview} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <MaterialIcons name="add-a-photo" size={34} color={COLORS.primary} />
                <Text style={styles.imageHint}>Thêm ảnh</Text>
              </View>
            )}
          </TouchableOpacity>
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.secondaryButton} onPress={pickImage}>
              <Text style={styles.secondaryButtonText}>Thư viện</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryButton} onPress={takePhoto}>
              <Text style={styles.secondaryButtonText}>Camera</Text>
            </TouchableOpacity>
            {form.imageUrl ? (
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => setForm((current) => ({ ...current, imageUrl: "" }))}
              >
                <Text style={styles.secondaryButtonText}>Bỏ ảnh</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          <Field label="URL ảnh (tuỳ chọn)">
            <TextInput
              style={styles.input}
              value={form.imageUrl}
              onChangeText={(value) => setForm((current) => ({ ...current, imageUrl: value }))}
              placeholder="https://..."
              autoCapitalize="none"
            />
          </Field>

          <Field label="Tên thực phẩm *">
            <TextInput
              style={styles.input}
              value={form.foodName}
              onChangeText={(value) => setForm((current) => ({ ...current, foodName: value }))}
              placeholder="VD: Táo đỏ"
            />
          </Field>

          <Field label="Danh mục *">
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.chipRow}>
                {categories.map((category) => (
                  <Chip
                    key={category._id}
                    label={getCategoryDisplayName(category)}
                    active={form.categoryId === category._id}
                    onPress={() => setForm((current) => ({ ...current, categoryId: category._id }))}
                  />
                ))}
              </View>
            </ScrollView>
          </Field>

          <Field label="Vị trí lưu trữ *">
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.chipRow}>
                {locations.map((location) => (
                  <Chip
                    key={location._id}
                    label={`${location.storageName} (${location.storageType})`}
                    active={form.storageLocationId === location._id}
                    onPress={() =>
                      setForm((current) => ({ ...current, storageLocationId: location._id }))
                    }
                  />
                ))}
              </View>
            </ScrollView>
          </Field>

          <View style={styles.row}>
            <Field label="Nguồn gốc">
              <View style={styles.chipRowWrap}>
                {SOURCE_TYPES.map((source) => (
                  <Chip
                    key={source.key}
                    label={source.label}
                    active={form.sourceType === source.key}
                    onPress={() =>
                      setForm((current) => ({ ...current, sourceType: source.key }))
                    }
                  />
                ))}
              </View>
            </Field>
            <Field label="Kiểu hạn dùng">
              <View style={styles.chipRowWrap}>
                {EXPIRY_TYPES.map((expiry) => (
                  <Chip
                    key={expiry.key}
                    label={expiry.label}
                    active={form.expiryType === expiry.key}
                    onPress={() =>
                      setForm((current) => ({ ...current, expiryType: expiry.key }))
                    }
                  />
                ))}
              </View>
            </Field>
          </View>

          <View style={styles.row}>
            <Field label="Số lượng *">
              <TextInput
                style={styles.input}
                value={form.quantity}
                keyboardType="numeric"
                onChangeText={(value) => setForm((current) => ({ ...current, quantity: value }))}
              />
            </Field>
            <Field label="Đơn vị *">
              <TextInput
                style={styles.input}
                value={form.unit}
                onChangeText={(value) => setForm((current) => ({ ...current, unit: value }))}
                placeholder="kg, g, item..."
              />
            </Field>
          </View>

          <View style={styles.row}>
            <Field label="Ngày mua *">
              <TextInput
                style={styles.input}
                value={form.purchaseDate}
                onChangeText={(value) => setForm((current) => ({ ...current, purchaseDate: value }))}
                placeholder="YYYY-MM-DD"
              />
            </Field>
            <Field label="Ngày hết hạn *">
              <TextInput
                style={styles.input}
                value={form.expiryDate}
                onChangeText={(value) => setForm((current) => ({ ...current, expiryDate: value }))}
                placeholder="YYYY-MM-DD"
              />
            </Field>
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.onPrimary} />
            ) : (
              <Text style={styles.buttonText}>Lưu thay đổi</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.82}
      style={[styles.chip, active && styles.chipActive]}
      onPress={onPress}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.surface },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.surface,
  },
  loadingText: { color: COLORS.onSurfaceVariant, marginTop: 12, fontWeight: "700" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.outlineVariant,
  },
  title: { fontSize: 18, fontWeight: "800", color: COLORS.onSurface },
  content: { padding: 16, paddingBottom: 44 },
  imagePicker: {
    height: 190,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    backgroundColor: COLORS.surfaceContainerLowest,
    overflow: "hidden",
    marginBottom: 10,
  },
  imagePreview: { width: "100%", height: "100%" },
  imagePlaceholder: { flex: 1, alignItems: "center", justifyContent: "center" },
  imageHint: { color: COLORS.primary, fontWeight: "800", marginTop: 8 },
  actionRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 14 },
  secondaryButton: {
    minHeight: 38,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    backgroundColor: COLORS.surfaceContainerLowest,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  secondaryButtonText: { color: COLORS.primary, fontSize: 13, fontWeight: "900" },
  field: { flex: 1, minWidth: 142, marginBottom: 12 },
  label: {
    fontSize: 12,
    fontWeight: "900",
    color: COLORS.onSurfaceVariant,
    marginBottom: 6,
  },
  input: {
    minHeight: 48,
    backgroundColor: COLORS.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    borderRadius: 8,
    paddingHorizontal: 13,
    color: COLORS.onSurface,
    fontSize: 15,
  },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  chipRow: { flexDirection: "row", gap: 8, paddingBottom: 10 },
  chipRowWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    minHeight: 36,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    backgroundColor: COLORS.surfaceContainer,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 13,
  },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { color: COLORS.onSurfaceVariant, fontSize: 12, fontWeight: "800" },
  chipTextActive: { color: COLORS.onPrimary },
  button: {
    minHeight: 52,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.55 },
  buttonText: { color: COLORS.onPrimary, fontSize: 15, fontWeight: "900" },
});
