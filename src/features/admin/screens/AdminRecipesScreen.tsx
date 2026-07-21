import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, Alert, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { COLORS } from '../../../constants/colors';
import { apiClient } from '../../../services/apiClient';

export default function AdminRecipesScreen() {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [recipes, setRecipes] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState('');
  
  // Basic Form State
  const [recipeName, setRecipeName] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchRecipes();
  }, []);

  const fetchRecipes = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/api/admin/recipes');
      if (response.data.success) {
        setRecipes(response.data.data);
      }
    } catch (error) {
      Alert.alert("Lỗi", "Không thể lấy danh sách công thức");
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setIsEditing(false);
    setRecipeName('');
    setDescription('');
    setModalVisible(true);
  };

  const openEditModal = (item: any) => {
    setIsEditing(true);
    setEditId(item._id);
    setRecipeName(item.recipeName || '');
    setDescription(item.description || '');
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!recipeName.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập tên món ăn");
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        recipeName,
        description,
        sourceType: 'SYSTEM',
        isActive: true
      };

      if (isEditing) {
        const res = await apiClient.put(`/api/admin/recipes/${editId}`, payload);
        if (res.data.success) {
          Alert.alert("Thành công", "Đã cập nhật công thức");
          setModalVisible(false);
          fetchRecipes();
        }
      } else {
        const res = await apiClient.post('/api/admin/recipes', payload);
        if (res.data.success) {
          Alert.alert("Thành công", "Đã thêm công thức nấu ăn mới");
          setModalVisible(false);
          fetchRecipes();
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
      "Bạn có chắc chắn muốn xóa công thức này?",
      [
        { text: "Hủy", style: "cancel" },
        { 
          text: "Xóa", 
          style: "destructive",
          onPress: async () => {
            try {
              const res = await apiClient.delete(`/api/admin/recipes/${id}`);
              if (res.data.success) fetchRecipes();
            } catch (e) {
              Alert.alert("Lỗi", "Không thể xóa");
            }
          }
        }
      ]
    );
  };

  const renderItem = ({ item }: { item: any }) => {
    const isVideoExtracted = item.sourceType === 'VIDEO_EXTRACTED';
    
    return (
      <TouchableOpacity style={styles.card} onPress={() => openEditModal(item)} activeOpacity={0.7}>
        <View style={styles.cardHeader}>
          <Text style={styles.title}>{item.recipeName}</Text>
          <View style={styles.actions}>
            <TouchableOpacity onPress={() => handleDelete(item._id)} style={styles.actionBtn}>
              <Ionicons name="trash" size={20} color={COLORS.error} />
            </TouchableOpacity>
          </View>
        </View>
        
        {isVideoExtracted && (
          <View style={styles.badgeBox}>
            <Ionicons name="logo-youtube" size={14} color="#ef4444" />
            <Text style={styles.badgeText}>Bóc tách từ Video AI</Text>
          </View>
        )}

        <Text style={styles.desc}>{item.description || "Chưa có mô tả"}</Text>
        
        <View style={styles.metaRow}>
          <Text style={styles.metaText}>Độ khó: {item.difficulty}</Text>
          <Text style={styles.metaText}>TG: {item.cookingTime || 0} phút</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Công thức nấu ăn</Text>
        <TouchableOpacity onPress={openAddModal} style={styles.addButton}>
          <Ionicons name="add" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>
      ) : (
        <FlatList
          data={recipes}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>Chưa có công thức nào</Text>}
        />
      )}

      {/* Add Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{isEditing ? 'Sửa công thức (Cơ bản)' : 'Thêm công thức (Cơ bản)'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.onSurface} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              value={recipeName}
              onChangeText={setRecipeName}
              placeholder="Tên món ăn *"
            />
            
            <TextInput
              style={[styles.input, { height: 80 }]}
              value={description}
              onChangeText={setDescription}
              placeholder="Mô tả ngắn gọn"
              multiline
              textAlignVertical="top"
            />

            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={submitting}>
              {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Lưu công thức</Text>}
            </TouchableOpacity>
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
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  title: { fontSize: 16, fontWeight: 'bold', color: COLORS.onSurface, flex: 1 },
  actions: { flexDirection: 'row' },
  actionBtn: { padding: 4 },
  badgeBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ef444420', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, marginBottom: 8, gap: 4 },
  badgeText: { color: '#ef4444', fontSize: 11, fontWeight: '600' },
  desc: { fontSize: 14, color: COLORS.onSurfaceVariant, marginBottom: 12 },
  metaRow: { flexDirection: 'row', gap: 16 },
  metaText: { fontSize: 12, color: COLORS.onSurface, fontWeight: '500' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: COLORS.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 18, fontWeight: 'bold' },
  input: { borderWidth: 1, borderColor: COLORS.outlineVariant, borderRadius: 8, padding: 12, fontSize: 15, marginBottom: 16, backgroundColor: COLORS.surfaceContainerLowest },
  saveBtn: { backgroundColor: COLORS.primary, padding: 16, borderRadius: 12, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});
