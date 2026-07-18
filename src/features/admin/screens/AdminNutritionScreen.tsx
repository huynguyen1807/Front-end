import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, Alert, Modal, TextInput, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { COLORS } from '../../../constants/colors';
import { apiClient } from '../../../services/apiClient';

export default function AdminNutritionScreen() {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [nutrition, setNutrition] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState('');
  
  // Form State
  const [foodName, setFoodName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [caloriesPerUnit, setCaloriesPerUnit] = useState('0');
  const [unit, setUnit] = useState('100g'); // simplified
  const [protein, setProtein] = useState('0');
  const [carbs, setCarbs] = useState('0');
  const [fat, setFat] = useState('0');
  const [submitting, setSubmitting] = useState(false);
  
  // Category Selector State
  const [showCategorySelector, setShowCategorySelector] = useState(false);

  useEffect(() => {
    fetchNutrition();
    fetchCategories();
  }, []);

  const fetchNutrition = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/api/admin/nutrition-facts');
      if (response.data.success) {
        setNutrition(response.data.data);
      }
    } catch (error) {
      Alert.alert("Lỗi", "Không thể lấy danh sách dinh dưỡng");
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await apiClient.get('/api/admin/food-categories');
      if (response.data.success) {
        setCategories(response.data.data);
      }
    } catch (error) {
      console.log("Cannot fetch categories");
    }
  };

  const openAddModal = () => {
    setIsEditing(false);
    setFoodName('');
    setCategoryId(categories.length > 0 ? categories[0]._id : '');
    setCaloriesPerUnit('0');
    setUnit('g');
    setProtein('0');
    setCarbs('0');
    setFat('0');
    setModalVisible(true);
  };

  const openEditModal = (item: any) => {
    setIsEditing(true);
    setEditId(item._id);
    setFoodName(item.foodName || '');
    setCategoryId(item.categoryId?._id || '');
    setCaloriesPerUnit(item.caloriesPerUnit?.toString() || '0');
    setUnit(item.unit || 'g');
    setProtein(item.protein?.toString() || '0');
    setCarbs(item.carbs?.toString() || '0');
    setFat(item.fat?.toString() || '0');
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!foodName.trim() || !categoryId) {
      Alert.alert("Lỗi", "Vui lòng nhập tên thực phẩm và chọn danh mục");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        foodName: foodName.trim(),
        categoryId,
        caloriesPerUnit: Number(caloriesPerUnit),
        unit,
        protein: Number(protein),
        carbs: Number(carbs),
        fat: Number(fat)
      };

      if (isEditing) {
        const res = await apiClient.put(`/api/admin/nutrition-facts/${editId}`, payload);
        if (res.data.success) {
          Alert.alert("Thành công", "Đã cập nhật dữ liệu");
          setModalVisible(false);
          fetchNutrition();
        }
      } else {
        const res = await apiClient.post('/api/admin/nutrition-facts', payload);
        if (res.data.success) {
          Alert.alert("Thành công", "Đã thêm dữ liệu mới");
          setModalVisible(false);
          fetchNutrition();
        }
      }
    } catch (error: any) {
      Alert.alert("Lỗi", error.response?.data?.message || "Không thể lưu");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      "Xác nhận xóa",
      "Bạn có chắc chắn muốn xóa dữ liệu này?",
      [
        { text: "Hủy", style: "cancel" },
        { 
          text: "Xóa", 
          style: "destructive",
          onPress: async () => {
            try {
              const res = await apiClient.delete(`/api/admin/nutrition-facts/${id}`);
              if (res.data.success) fetchNutrition();
            } catch (e) {
              Alert.alert("Lỗi", "Không thể xóa");
            }
          }
        }
      ]
    );
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.card} onPress={() => openEditModal(item)} activeOpacity={0.7}>
      <View style={styles.cardHeader}>
        <Text style={styles.title}>{item.foodName}</Text>
        <TouchableOpacity onPress={() => handleDelete(item._id)} style={styles.actionBtn}>
          <Ionicons name="trash" size={20} color={COLORS.error} />
        </TouchableOpacity>
      </View>
      <View style={styles.badgeBox}>
        <Text style={styles.badgeText}>Danh mục: {item.categoryId?.displayName || 'Unknown'}</Text>
      </View>
      <View style={styles.macroRow}>
        <View style={styles.macroItem}>
          <Text style={styles.macroValue}>{item.caloriesPerUnit}</Text>
          <Text style={styles.macroLabel}>Kcal/{item.unit}</Text>
        </View>
        <View style={styles.macroItem}>
          <Text style={styles.macroValue}>{item.protein}g</Text>
          <Text style={styles.macroLabel}>Protein</Text>
        </View>
        <View style={styles.macroItem}>
          <Text style={styles.macroValue}>{item.carbs}g</Text>
          <Text style={styles.macroLabel}>Carbs</Text>
        </View>
        <View style={styles.macroItem}>
          <Text style={styles.macroValue}>{item.fat}g</Text>
          <Text style={styles.macroLabel}>Fat</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Dữ liệu dinh dưỡng</Text>
        <TouchableOpacity onPress={openAddModal} style={styles.addButton}>
          <Ionicons name="add" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>
      ) : (
        <FlatList
          data={nutrition}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>Chưa có dữ liệu nào</Text>}
        />
      )}

      {/* Main Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            
            {showCategorySelector ? (
              // Category Selector View inside Modal
              <View style={{ flex: 1 }}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Chọn Danh Mục</Text>
                  <TouchableOpacity onPress={() => setShowCategorySelector(false)}>
                    <Ionicons name="close" size={24} color={COLORS.onSurface} />
                  </TouchableOpacity>
                </View>
                <ScrollView>
                  {categories.map(cat => (
                    <TouchableOpacity 
                      key={cat._id} 
                      style={styles.categoryItem}
                      onPress={() => {
                        setCategoryId(cat._id);
                        setShowCategorySelector(false);
                      }}
                    >
                      <Text style={styles.categoryItemText}>{cat.displayName || cat.categoryName}</Text>
                      {categoryId === cat._id && <Ionicons name="checkmark" size={20} color={COLORS.primary} />}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            ) : (
              // Normal Form View
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{isEditing ? 'Sửa dữ liệu' : 'Thêm dữ liệu mới'}</Text>
                  <TouchableOpacity onPress={() => setModalVisible(false)}>
                    <Ionicons name="close" size={24} color={COLORS.onSurface} />
                  </TouchableOpacity>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Tên thực phẩm *</Text>
                  <TextInput
                    style={styles.input}
                    value={foodName}
                    onChangeText={setFoodName}
                    placeholder="VD: Thịt gà xé"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Thuộc danh mục *</Text>
                  <TouchableOpacity 
                    style={styles.selectorBtn}
                    onPress={() => setShowCategorySelector(true)}
                  >
                    <Text style={styles.selectorText}>
                      {categories.find(c => c._id === categoryId)?.displayName || 'Chọn danh mục'}
                    </Text>
                    <Ionicons name="chevron-down" size={20} color={COLORS.onSurfaceVariant} />
                  </TouchableOpacity>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Đơn vị tính (VD: g, ml, item)</Text>
                  <TextInput
                    style={styles.input}
                    value={unit}
                    onChangeText={setUnit}
                    placeholder="VD: g"
                    autoCapitalize="none"
                  />
                </View>

                <View style={styles.macroGrid}>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.label}>Calo (Kcal)</Text>
                    <TextInput style={styles.input} value={caloriesPerUnit} onChangeText={setCaloriesPerUnit} keyboardType="numeric" />
                  </View>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.label}>Protein (g)</Text>
                    <TextInput style={styles.input} value={protein} onChangeText={setProtein} keyboardType="numeric" />
                  </View>
                </View>

                <View style={styles.macroGrid}>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.label}>Carbs (g)</Text>
                    <TextInput style={styles.input} value={carbs} onChangeText={setCarbs} keyboardType="numeric" />
                  </View>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.label}>Fat (g)</Text>
                    <TextInput style={styles.input} value={fat} onChangeText={setFat} keyboardType="numeric" />
                  </View>
                </View>

                <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={submitting}>
                  {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Lưu dữ liệu</Text>}
                </TouchableOpacity>
              </ScrollView>
            )}

          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: COLORS.surface, borderBottomWidth: 1, borderColor: COLORS.outlineVariant + '50' },
  backButton: { padding: 8, marginLeft: -8 },
  addButton: { padding: 8, marginRight: -8 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: COLORS.onSurface },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { textAlign: 'center', marginTop: 20, color: COLORS.onSurfaceVariant },
  list: { padding: 16, gap: 16 },
  card: { backgroundColor: COLORS.surface, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: COLORS.outlineVariant + '50', elevation: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  title: { fontSize: 16, fontWeight: 'bold', color: COLORS.onSurface },
  actionBtn: { padding: 4 },
  badgeBox: { alignSelf: 'flex-start', backgroundColor: COLORS.surfaceContainerHighest, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginBottom: 12 },
  badgeText: { color: COLORS.onSurfaceVariant, fontSize: 12, fontWeight: '500' },
  macroRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: COLORS.surfaceContainerLowest, padding: 12, borderRadius: 8 },
  macroItem: { alignItems: 'center' },
  macroValue: { fontSize: 14, fontWeight: 'bold', color: COLORS.primary, marginBottom: 2 },
  macroLabel: { fontSize: 11, color: COLORS.onSurfaceVariant },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: COLORS.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '85%', minHeight: '60%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 18, fontWeight: 'bold' },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '500', color: COLORS.onSurfaceVariant, marginBottom: 8 },
  input: { borderWidth: 1, borderColor: COLORS.outlineVariant, borderRadius: 8, padding: 12, fontSize: 15, backgroundColor: COLORS.surfaceContainerLowest },
  selectorBtn: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: COLORS.outlineVariant, borderRadius: 8, padding: 12, backgroundColor: COLORS.surfaceContainerLowest },
  selectorText: { fontSize: 15, color: COLORS.onSurface },
  macroGrid: { flexDirection: 'row', gap: 12 },
  saveBtn: { backgroundColor: COLORS.primary, padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 16, marginBottom: 24 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  categoryItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: COLORS.outlineVariant + '30' },
  categoryItemText: { fontSize: 16, color: COLORS.onSurface }
});
