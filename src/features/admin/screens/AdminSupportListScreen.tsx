import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { COLORS } from '../../../constants/colors';
import { apiClient } from '../../../services/apiClient';

export default function AdminSupportListScreen() {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState<any[]>([]);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/api/admin/support');
      const data = response.data;
      if (data.success) {
        setTickets(data.data);
      } else {
        Alert.alert("Lỗi", "Không thể lấy danh sách yêu cầu hỗ trợ");
      }
    } catch (error) {
      Alert.alert("Lỗi", "Lỗi kết nối mạng");
    } finally {
      setLoading(false);
    }
  };

  const handleResolveTicket = (ticketId: string) => {
    Alert.alert(
      "Đánh dấu đã giải quyết",
      "Bạn chắc chắn đã giải quyết xong yêu cầu hỗ trợ này?",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Đồng ý",
          style: "default",
          onPress: async () => {
            try {
              const response = await apiClient.patch(`/api/admin/support/${ticketId}/resolve`);
              const data = response.data;
              if (data.success) {
                Alert.alert("Thành công", "Đã đánh dấu xử lý xong");
                fetchTickets(); // Refresh list
              } else {
                Alert.alert("Lỗi", data.message || "Không thể cập nhật");
              }
            } catch (error: any) {
              Alert.alert("Lỗi", error.response?.data?.message || "Lỗi kết nối");
            }
          }
        }
      ]
    );
  };

  const renderTicketItem = ({ item }: { item: any }) => {
    const isStuck = item.category === 'STUCK_HOUSEHOLD';

    return (
      <View style={[styles.ticketCard, isStuck && { borderColor: COLORS.error + '40', borderWidth: 2 }]}>
        <View style={styles.ticketHeader}>
          <View style={styles.userInfo}>
            <View style={[styles.avatarPlaceholder, isStuck && { backgroundColor: COLORS.error + '20' }]}>
              <Ionicons name="person" size={20} color={isStuck ? COLORS.error : COLORS.primary} />
            </View>
            <View>
              <Text style={styles.userName}>{item.userId?.fullName || 'Người dùng ẩn danh'}</Text>
              <Text style={styles.userEmail}>{item.userId?.email || 'Không có email'}</Text>
            </View>
          </View>
          <View style={[
            styles.statusBadge, 
            { backgroundColor: item.status === 'RESOLVED' ? COLORS.primaryContainer : COLORS.surfaceContainerHighest }
          ]}>
            <Text style={[
              styles.statusText, 
              { color: item.status === 'RESOLVED' ? COLORS.primary : COLORS.onSurfaceVariant }
            ]}>
              {item.status === 'RESOLVED' ? 'Đã xử lý' : 'Đang chờ'}
            </Text>
          </View>
        </View>
        
        <View style={styles.ticketContent}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryBadgeText}>
              {item.category === 'STUCK_HOUSEHOLD' ? '🛑 Kẹt gia đình' : item.category === 'APP_BUG' ? '🐞 Lỗi hệ thống' : '💬 Góp ý khác'}
            </Text>
          </View>
          <Text style={styles.contentText}>{item.content}</Text>
        </View>

        <View style={styles.ticketFooter}>
          <Text style={styles.dateText}>
            {new Date(item.createdAt).toLocaleString('vi-VN')}
          </Text>
          {item.status === 'PENDING' && (
            <TouchableOpacity 
              style={[styles.resolveButton, isStuck && { backgroundColor: COLORS.error }]}
              onPress={() => handleResolveTicket(item._id)}
            >
              <Ionicons name={isStuck ? "flash" : "checkmark-circle-outline"} size={16} color={COLORS.onPrimary} />
              <Text style={styles.resolveButtonText}>{isStuck ? "Gỡ kẹt ngay" : "Xong"}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Hỗ trợ người dùng</Text>
        <View style={styles.placeholder} />
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : tickets.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons name="checkmark-done-circle-outline" size={64} color={COLORS.primaryContainer} />
          <Text style={styles.emptyText}>Không có yêu cầu hỗ trợ nào</Text>
        </View>
      ) : (
        <FlatList
          data={tickets}
          keyExtractor={(item) => item._id}
          renderItem={renderTicketItem}
          contentContainerStyle={styles.listContainer}
          refreshing={loading}
          onRefresh={fetchTickets}
        />
      )}
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.onSurfaceVariant,
  },
  listContainer: {
    padding: 16,
  },
  ticketCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant + '40',
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primaryContainer + '40',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.onSurface,
  },
  userEmail: {
    fontSize: 13,
    color: COLORS.onSurfaceVariant,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  ticketContent: {
    backgroundColor: COLORS.surfaceContainerLowest,
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  categoryBadge: {
    backgroundColor: COLORS.surfaceContainerHighest,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 8,
  },
  categoryBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.onSurfaceVariant,
  },
  contentText: {
    fontSize: 14,
    color: COLORS.onSurface,
    lineHeight: 20,
  },
  ticketFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 12,
    color: COLORS.onSurfaceVariant,
  },
  resolveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  resolveButtonText: {
    color: COLORS.onPrimary,
    fontSize: 13,
    fontWeight: '600',
  }
});
