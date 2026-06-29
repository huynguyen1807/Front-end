import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  Alert, ActivityIndicator, StyleSheet, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';

import { COLORS } from '../../../constants/colors';
import { useAppDispatch } from '../../../redux/hooks';
import { updateFoodItem } from '../redux/inventorySlice';
import { updateFoodApi } from '../services/foodApi';
import { FoodItem } from '../types/inventory';

export default function UpdateFoodScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const dispatch = useAppDispatch();

  const item: FoodItem = route.params?.item;

  const [form, setForm] = useState({
    foodName: item?.foodName ?? '',
    quantity: String(item?.quantity ?? ''),
    unit: item?.unit ?? '',
    expiryDate: item?.expiryDate?.split('T')[0] ?? '',
    purchaseDate: item?.purchaseDate?.split('T')[0] ?? '',
  });

  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!form.foodName.trim() || !form.expiryDate || !form.quantity) {
      Alert.alert('Thiếu thông tin', 'Vui lòng điền đầy đủ tên, số lượng và ngày hết hạn');
      return;
    }

    if (form.purchaseDate && form.expiryDate) {
      const pDate = new Date(form.purchaseDate);
      const eDate = new Date(form.expiryDate);
      if (eDate < pDate) {
        Alert.alert('Lỗi', 'Ngày hết hạn không được trước ngày mua'); return;
      }
    }

    try {
      setLoading(true);
      const updated = await updateFoodApi(item._id, {
        foodName: form.foodName.trim(),
        quantity: Number(form.quantity),
        unit: form.unit,
        expiryDate: form.expiryDate,
        purchaseDate: form.purchaseDate,
      });
      dispatch(updateFoodItem(updated));
      Alert.alert('Đã cập nhật', `"${updated.foodName}" đã được lưu`, [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      Alert.alert('Lỗi', err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color={COLORS.onSurface} />
        </TouchableOpacity>
        <Text style={styles.title}>Sửa thực phẩm</Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        <Text style={styles.label}>Tên thực phẩm *</Text>
        <TextInput
          style={styles.input}
          value={form.foodName}
          onChangeText={(v) => setForm((f) => ({ ...f, foodName: v }))}
          placeholder="Tên thực phẩm"
        />

        <View style={styles.row}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={styles.label}>Số lượng *</Text>
            <TextInput
              style={styles.input}
              value={form.quantity}
              keyboardType="numeric"
              onChangeText={(v) => setForm((f) => ({ ...f, quantity: v }))}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Đơn vị</Text>
            <TextInput
              style={styles.input}
              value={form.unit}
              onChangeText={(v) => setForm((f) => ({ ...f, unit: v }))}
            />
          </View>
        </View>

        <Text style={styles.label}>Ngày mua</Text>
        <TextInput
          style={styles.input}
          value={form.purchaseDate}
          onChangeText={(v) => setForm((f) => ({ ...f, purchaseDate: v }))}
          placeholder="YYYY-MM-DD"
        />

        <Text style={styles.label}>Ngày hết hạn *</Text>
        <TextInput
          style={styles.input}
          value={form.expiryDate}
          onChangeText={(v) => setForm((f) => ({ ...f, expiryDate: v }))}
          placeholder="YYYY-MM-DD"
        />

        <TouchableOpacity
          style={[styles.button, loading && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.buttonText}>Lưu thay đổi</Text>
          }
        </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
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
  content: { padding: 16, paddingBottom: 40 },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.onSurface, marginBottom: 6, marginTop: 4 },
  input: {
    backgroundColor: COLORS.surfaceContainer, borderWidth: 1, borderColor: COLORS.outlineVariant,
    borderRadius: 10, paddingHorizontal: 14, height: 48,
    fontSize: 15, color: COLORS.onSurface, marginBottom: 16,
  },
  row: { flexDirection: 'row' },
  button: {
    backgroundColor: COLORS.primary, height: 54, borderRadius: 27,
    justifyContent: 'center', alignItems: 'center', marginTop: 8,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
