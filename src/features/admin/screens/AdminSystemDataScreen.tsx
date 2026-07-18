import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { COLORS } from '../../../constants/colors';

export default function AdminSystemDataScreen() {
  const navigation = useNavigation<any>();

  const menuItems = [
    {
      id: 'categories',
      title: 'Danh mục thực phẩm',
      subtitle: 'Quản lý các nhóm như Thịt, Rau củ, Trái cây...',
      icon: 'format-list-bulleted-type',
      color: '#10b981',
      route: 'AdminCategoryList'
    },
    {
      id: 'storageRules',
      title: 'Quy tắc bảo quản',
      subtitle: 'Thiết lập thời gian hết hạn mặc định (Tủ lạnh, tủ đông)',
      icon: 'snowflake',
      color: '#3b82f6',
      route: 'AdminStorageRules'
    },
    {
      id: 'recipes',
      title: 'Công thức nấu ăn',
      subtitle: 'Thêm, sửa, xóa các công thức món ăn gợi ý',
      icon: 'pot-steam-outline',
      color: '#f59e0b',
      route: 'AdminRecipes'
    },
    {
      id: 'nutrition',
      title: 'Dữ liệu dinh dưỡng',
      subtitle: 'Bảng Calo, Protein, Fat mặc định cho thực phẩm',
      icon: 'leaf',
      color: '#8b5cf6',
      route: 'AdminNutrition'
    }
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Dữ liệu hệ thống</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.introCard}>
          <Ionicons name="server-outline" size={32} color={COLORS.primary} style={{ marginBottom: 12 }} />
          <Text style={styles.introTitle}>Trung tâm điều khiển Data</Text>
          <Text style={styles.introText}>
            Những dữ liệu bạn thiết lập ở đây sẽ là cơ sở nền tảng để AI gợi ý nấu ăn và cảnh báo hết hạn cho toàn bộ người dùng.
          </Text>
        </View>

        <View style={styles.menuContainer}>
          {menuItems.map((item) => (
            <TouchableOpacity 
              key={item.id} 
              style={styles.menuCard}
              onPress={() => navigation.navigate(item.route)}
            >
              <View style={[styles.iconBox, { backgroundColor: item.color + '15' }]}>
                <MaterialCommunityIcons name={item.icon as any} size={28} color={item.color} />
              </View>
              <View style={styles.menuInfo}>
                <Text style={styles.menuTitle}>{item.title}</Text>
                <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.onSurfaceVariant} />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.outlineVariant + '50',
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.onSurface,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  introCard: {
    backgroundColor: COLORS.primaryContainer + '40',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.primaryContainer,
  },
  introTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 8,
  },
  introText: {
    fontSize: 14,
    color: COLORS.onSurfaceVariant,
    lineHeight: 20,
  },
  menuContainer: {
    gap: 16,
  },
  menuCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant + '30',
  },
  iconBox: {
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuInfo: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.onSurface,
    marginBottom: 4,
  },
  menuSubtitle: {
    fontSize: 13,
    color: COLORS.onSurfaceVariant,
  }
});
