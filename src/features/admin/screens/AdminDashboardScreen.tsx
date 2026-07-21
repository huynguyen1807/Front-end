import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { COLORS } from '../../../constants/colors';

import { apiClient } from '../../../services/apiClient';

export default function AdminDashboardScreen() {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/api/admin/stats');
      const data = response.data;
      if (data.success) {
        setStats(data.data);
      } else {
        Alert.alert("Lỗi", "Không thể lấy dữ liệu thống kê");
      }
    } catch (error) {
      Alert.alert("Lỗi", "Lỗi kết nối mạng");
    } finally {
      setLoading(false);
    }
  };

  const renderStatCard = (icon: any, color: string, value: string | number, label: string) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <View style={styles.statInfo}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </View>
    </View>
  );

  const handleLogout = () => {
    Alert.alert(
      "Đăng xuất",
      "Bạn có chắc chắn muốn đăng xuất khỏi ứng dụng?",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Đăng xuất",
          style: "destructive",
          onPress: async () => {
            // Cannot import AsyncStorage without adding it back, so we will use require
            const AsyncStorage = require('@react-native-async-storage/async-storage').default;
            await AsyncStorage.removeItem('userToken');
            await AsyncStorage.removeItem('userInfo');
            navigation.replace('Login');
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.placeholder} />
        <Text style={styles.headerTitle}>Quản trị hệ thống</Text>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Ionicons name="log-out-outline" size={24} color={COLORS.error} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>Tổng quan</Text>
        
        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} />
        ) : (
          <View style={styles.statsGrid}>
            {renderStatCard('people', COLORS.primary, stats?.totalUsers || 0, 'Người dùng')}
            {renderStatCard('home', COLORS.secondary, stats?.activeHouseholds || 0, 'Gia đình')}
            {renderStatCard('cash', COLORS.primaryContainer, stats?.totalRevenue || '0đ', 'Doanh thu')}
            {renderStatCard('person-add', COLORS.secondaryContainer, stats?.newUsersToday || 0, 'Đăng ký mới')}
          </View>
        )}

        <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Quản lý chi tiết</Text>
        
        <TouchableOpacity 
          style={styles.menuItem} 
          onPress={() => navigation.navigate("AdminUserList")}
        >
          <View style={[styles.menuIcon, { backgroundColor: COLORS.primary + '20' }]}>
            <Ionicons name="people" size={24} color={COLORS.primary} />
          </View>
          <View style={styles.menuTextContainer}>
            <Text style={styles.menuTitle}>Hỗ trợ & Quản lý User</Text>
            <Text style={styles.menuSubtitle}>Xem danh sách, kiểm tra Household</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={COLORS.onSurfaceVariant} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.menuItem} 
          onPress={() => navigation.navigate("AdminSupportList")}
        >
          <View style={[styles.menuIcon, { backgroundColor: COLORS.error + '20' }]}>
            <Ionicons name="mail-unread" size={24} color={COLORS.error} />
          </View>
          <View style={styles.menuTextContainer}>
            <Text style={styles.menuTitle}>Đơn Yêu Cầu Hỗ Trợ</Text>
            <Text style={styles.menuSubtitle}>Giải quyết lỗi người dùng báo cáo</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={COLORS.onSurfaceVariant} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate("AdminSystemData")}>
          <View style={[styles.menuIcon, { backgroundColor: COLORS.secondary + '20' }]}>
            <Ionicons name="restaurant" size={24} color={COLORS.secondary} />
          </View>
          <View style={styles.menuTextContainer}>
            <Text style={styles.menuTitle}>Dữ liệu hệ thống</Text>
            <Text style={styles.menuSubtitle}>Công thức nấu ăn, Danh mục, Quy tắc bảo quản</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={COLORS.onSurfaceVariant} />
        </TouchableOpacity>

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
    borderBottomWidth: 1,
    borderBottomColor: COLORS.outlineVariant,
    backgroundColor: COLORS.surface,
  },
  logoutButton: {
    padding: 8,
    marginRight: -8,
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
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.onSurface,
    marginBottom: 16,
  },
  loader: {
    marginTop: 40,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statInfo: {},
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.onSurface,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: COLORS.onSurfaceVariant,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  menuIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuTextContainer: {
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
  },
});
