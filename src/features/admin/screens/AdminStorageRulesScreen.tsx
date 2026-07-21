import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, Alert, Modal, TextInput, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { COLORS } from '../../../constants/colors';
import { apiClient } from '../../../services/apiClient';

const STORAGE_TYPES = ['REFRIGERATOR', 'OUTSIDE', 'FREEZER', 'PANTRY', 'KITCHEN_CABINET'];

export default function AdminStorageRulesScreen() {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [rules, setRules] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState('');
  
  // Form State
  const [categoryId, setCategoryId] = useState('');
  const [storageType, setStorageType] = useState('REFRIGERATOR');
  const [estimatedDays, setEstimatedDays] = useState('3');
  const [instruction, setInstruction] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  // Selectors State
  const [showCategorySelector, setShowCategorySelector] = useState(false);
  const [showTypeSelector, setShowTypeSelector] = useState(false);

  useEffect(() => {
    fetchRules();
    fetchCategories();
  }, []);

  const fetchRules = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/api/admin/storage-rules');
      if (response.data.success) {
        setRules(response.data.data);
      }
    } catch (error) {
      Alert.alert("Lỗi", "Không thể lấy danh sách quy tắc");
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
    setCategoryId(categories.length > 0 ? categories[0]._id : '');
    setStorageType('REFRIGERATOR');
    setEstimatedDays('3');
    setInstruction('');
    setModalVisible(true);
  };

  const openEditModal = (item: any) => {
    setIsEditing(true);
    setEditId(item._id);
    setCategoryId(item.categoryId?._id || '');
    setStorageType(item.storageType || 'REFRIGERATOR');
    setEstimatedDays(item.estimatedDays?.toString() || '0');
    setInstruction(item.instruction || '');
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!categoryId) {
      Alert.alert("Lỗi", "Vui lòng chọn danh mục thực phẩm");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        categoryId,
        storageType,
        estimatedDays: Number(estimatedDays),
        instruction
      };

      if (isEditing) {
        const res = await apiClient.put(`/api/admin/storage-rules/${editId}`, payload);
        if (res.data.success) {
          Alert.alert("Thành công", "Đã cập nhật quy tắc");
          setModalVisible(false);
          fetchRules();
        }
      } else {
        const res = await apiClient.post('/api/admin/storage-rules', payload);
        if (res.data.success) {
          Alert.alert("Thành công", "Đã thêm quy tắc mới");
          setModalVisible(false);
          fetchRules();
        }
      }
    } catch (error: any) {
      Alert.alert("Lỗi", error.response?.data?.message || "Không thể lưu quy tắc");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      "Xác nhận xóa",
      "Bạn có chắc chắn muốn xóa quy tắc bảo quản này?",
      [
        { text: "Hủy", style: "cancel" },
        { 
          text: "Xóa", 
          style: "destructive",
          onPress: async () => {
            try {
              const res = await apiClient.delete(`/api/admin/storage-rules/${id}`);
              if (res.data.success) fetchRules();
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
        <Text style={styles.title}>{item.categoryId?.displayName || item.categoryId?.categoryName || 'Unknown Category'}</Text>
        <TouchableOpacity onPress={() => handleDelete(item._id)} style={styles.actionBtn}>
          <Ionicons name="trash" size={20} color={COLORS.error} />
        </TouchableOpacity>
      </View>
      <View style={styles.badgeBox}>
        <Text style={styles.badgeText}>{item.storageType}</Text>
      </View>
      <Text style={styles.desc}>Thời gian dự kiến: {item.estimatedDays} ngày</Text>
      {item.instruction && <Text style={styles.instruction}>HD: {item.instruction}</Text>}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Quy tắc bảo quản</Text>
        <TouchableOpacity onPress={openAddModal} style={styles.addButton}>
          <Ionicons name="add" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>
      ) : (
        <FlatList
          data={rules}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>Chưa có quy tắc nào</Text>}
        />
      )}

      {/* Main Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            
            {showCategorySelector ? (
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
                      onPress={() => { setCategoryId(cat._id); setShowCategorySelector(false); }}
                    >
                      <Text style={styles.categoryItemText}>{cat.displayName || cat.categoryName}</Text>
                      {categoryId === cat._id && <Ionicons name="checkmark" size={20} color={COLORS.primary} />}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            ) : showTypeSelector ? (
              <View style={{ flex: 1 }}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Chọn Nơi Bảo Quản</Text>
                  <TouchableOpacity onPress={() => setShowTypeSelector(false)}>
                    <Ionicons name="close" size={24} color={COLORS.onSurface} />
                  </TouchableOpacity>
                </View>
                <ScrollView>
                  {STORAGE_TYPES.map(type => (
                    <TouchableOpacity 
                      key={type} 
                      style={styles.categoryItem}
                      onPress={() => { setStorageType(type); setShowTypeSelector(false); }}
                    >
                      <Text style={styles.categoryItemText}>{type}</Text>
                      {storageType === type && <Ionicons name="checkmark" size={20} color={COLORS.primary} />}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            ) : (
              // Normal Form View
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{isEditing ? 'Sửa quy tắc' : 'Thêm quy tắc mới'}</Text>
                  <TouchableOpacity onPress={() => setModalVisible(false)}>
                    <Ionicons name="close" size={24} color={COLORS.onSurface} />
                  </TouchableOpacity>
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
                  <Text style={styles.label}>Nơi bảo quản (Loại tủ) *</Text>
                  <TouchableOpacity 
                    style={styles.selectorBtn}
                    onPress={() => setShowTypeSelector(true)}
                  >
                    <Text style={styles.selectorText}>{storageType}</Text>
                    <Ionicons name="chevron-down" size={20} color={COLORS.onSurfaceVariant} />
                  </TouchableOpacity>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Thời gian dự kiến (Ngày)</Text>
                  <TextInput
                    style={styles.input}
                    value={estimatedDays}
                    onChangeText={setEstimatedDays}
                    keyboardType="numeric"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Hướng dẫn bảo quản</Text>
                  <TextInput
                    style={[styles.input, { height: 80 }]}
                    value={instruction}
                    onChangeText={setInstruction}
                    placeholder="VD: Rửa sạch trước khi cho vào hộp..."
                    multiline
                    textAlignVertical="top"
                  />
                </View>

                <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={submitting}>
                  {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Lưu quy tắc</Text>}
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
  badgeBox: { alignSelf: 'flex-start', backgroundColor: COLORS.primaryContainer, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginBottom: 8 },
  badgeText: { color: COLORS.primary, fontSize: 12, fontWeight: '600' },
  desc: { fontSize: 14, color: COLORS.onSurface, marginBottom: 4 },
  instruction: { fontSize: 13, color: COLORS.onSurfaceVariant, fontStyle: 'italic' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: COLORS.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '85%', minHeight: '60%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 18, fontWeight: 'bold' },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '500', color: COLORS.onSurfaceVariant, marginBottom: 8 },
  input: { borderWidth: 1, borderColor: COLORS.outlineVariant, borderRadius: 8, padding: 12, fontSize: 15, backgroundColor: COLORS.surfaceContainerLowest },
  selectorBtn: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: COLORS.outlineVariant, borderRadius: 8, padding: 12, backgroundColor: COLORS.surfaceContainerLowest },
  selectorText: { fontSize: 15, color: COLORS.onSurface },
  saveBtn: { backgroundColor: COLORS.primary, padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 16, marginBottom: 24 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  categoryItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: COLORS.outlineVariant + '30' },
  categoryItemText: { fontSize: 16, color: COLORS.onSurface }
});
