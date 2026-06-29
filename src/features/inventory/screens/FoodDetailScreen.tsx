import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS } from '../../../constants/colors';
import { RADIUS, SPACING } from '../../../constants/spacing';
import { FoodItem } from '../types/inventory';

const STATUS_CONFIG = {
  SAFE:        { color: COLORS.primary,   label: "Còn tốt",     icon: "check-circle" as const },
  NEAR_EXPIRY: { color: "#F59E0B",        label: "Sắp hết hạn", icon: "warning" as const },
  EXPIRED:     { color: COLORS.tertiary,  label: "Hết hạn",     icon: "error" as const },
  NEED_CHECK:  { color: COLORS.onSurfaceVariant, label: "Cần kiểm tra", icon: "help" as const },
};

function getDaysLeft(expiryDate: string): number {
  const diff = new Date(expiryDate).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default function FoodDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { item } = route.params as { item: FoodItem };

  const cfg = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.SAFE;
  const daysLeft = getDaysLeft(item.expiryDate);
  const freshnessScore = item.freshnessScore ?? 0;
  const isUrgent = daysLeft <= 1;

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const d = new Date(dateString);
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color={COLORS.onSurface} />
        </TouchableOpacity>
        <Text style={styles.title}>Chi tiết thực phẩm</Text>
        <TouchableOpacity onPress={() => navigation.navigate('UpdateFood', { item })} style={styles.editBtn}>
          <MaterialIcons name="edit" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.imageContainer}>
          {item.imageUrl ? (
            <Image source={{ uri: item.imageUrl }} style={styles.image} />
          ) : (
            <View style={[styles.image, styles.imagePlaceholder]}>
              <MaterialIcons name="fastfood" size={80} color={COLORS.primary + "60"} />
            </View>
          )}
          {isUrgent && (
            <View style={styles.urgentBadge}>
              <Text style={styles.urgentText}>Cần dùng ngay!</Text>
            </View>
          )}
        </View>

        <View style={styles.infoContainer}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{item.foodName}</Text>
            <View style={[styles.statusBadge, { backgroundColor: cfg.color + "22" }]}>
              <MaterialIcons name={cfg.icon} size={14} color={cfg.color} />
              <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.label}</Text>
            </View>
          </View>
          
          <Text style={styles.category}>{item.categoryId?.categoryName ?? 'Chưa phân loại'}</Text>

          {/* Freshness Section */}
          <View style={styles.card}>
            <View style={styles.progressHeader}>
              <Text style={styles.cardTitle}>Độ tươi ngon</Text>
              <Text style={[styles.percent, { color: cfg.color, fontWeight: 'bold' }]}>{freshnessScore}%</Text>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${freshnessScore}%`, backgroundColor: cfg.color }]} />
            </View>
            <Text style={[styles.daysLeft, { color: cfg.color, marginTop: 8 }]}>
              {daysLeft > 0 ? `Còn ${daysLeft} ngày` : daysLeft === 0 ? "Hết hạn hôm nay" : `Quá hạn ${Math.abs(daysLeft)} ngày`}
            </Text>
          </View>

          {/* Detail Info Section */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Thông tin chi tiết</Text>
            <View style={styles.detailRow}>
              <MaterialIcons name="inventory" size={20} color={COLORS.onSurfaceVariant} style={styles.detailIcon} />
              <Text style={styles.detailLabel}>Số lượng:</Text>
              <Text style={styles.detailValue}>{item.quantity} {item.unit}</Text>
            </View>
            <View style={styles.detailRow}>
              <MaterialIcons name="place" size={20} color={COLORS.onSurfaceVariant} style={styles.detailIcon} />
              <Text style={styles.detailLabel}>Vị trí lưu trữ:</Text>
              <Text style={styles.detailValue}>{item.storageLocationId?.storageName ?? 'N/A'}</Text>
            </View>
            <View style={styles.detailRow}>
              <MaterialIcons name="shopping-cart" size={20} color={COLORS.onSurfaceVariant} style={styles.detailIcon} />
              <Text style={styles.detailLabel}>Nguồn gốc:</Text>
              <Text style={styles.detailValue}>{item.sourceType === 'SUPERMARKET' ? 'Siêu thị' : item.sourceType === 'MARKET' ? 'Chợ' : 'Khác'}</Text>
            </View>
          </View>

          {/* Date Section */}
          <View style={styles.card}>
             <Text style={styles.cardTitle}>Thời gian</Text>
             <View style={styles.detailRow}>
              <MaterialIcons name="event" size={20} color={COLORS.onSurfaceVariant} style={styles.detailIcon} />
              <Text style={styles.detailLabel}>Ngày mua:</Text>
              <Text style={styles.detailValue}>{formatDate(item.purchaseDate)}</Text>
            </View>
             <View style={styles.detailRow}>
              <MaterialIcons name="event-busy" size={20} color={COLORS.onSurfaceVariant} style={styles.detailIcon} />
              <Text style={styles.detailLabel}>Ngày hết hạn:</Text>
              <Text style={[styles.detailValue, { color: isUrgent ? COLORS.tertiary : COLORS.onSurface }]}>{formatDate(item.expiryDate)}</Text>
            </View>
          </View>

        </View>
      </ScrollView>
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
  backBtn: { padding: 4 },
  editBtn: { padding: 4 },
  title: { fontSize: 18, fontWeight: '700', color: COLORS.onSurface },
  content: { paddingBottom: 40 },
  imageContainer: { height: 250, position: "relative", backgroundColor: COLORS.surfaceContainer },
  image: { width: "100%", height: "100%" },
  imagePlaceholder: { justifyContent: "center", alignItems: "center" },
  urgentBadge: {
    position: "absolute", top: SPACING.md, right: SPACING.md,
    backgroundColor: COLORS.tertiary, paddingHorizontal: SPACING.md, paddingVertical: 6,
    borderRadius: RADIUS.full,
  },
  urgentText: { color: COLORS.onTertiary, fontSize: 13, fontWeight: "700" },
  infoContainer: { padding: SPACING.lg },
  nameRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 },
  name: { fontSize: 24, fontWeight: "800", color: COLORS.onSurface, flex: 1, marginRight: 8 },
  statusBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: RADIUS.full,
  },
  statusText: { fontSize: 13, fontWeight: "700" },
  category: { fontSize: 15, color: COLORS.primary, fontWeight: "600", marginBottom: SPACING.xl },
  card: {
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: "rgba(189, 202, 191, 0.35)",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardTitle: { fontSize: 16, fontWeight: "700", color: COLORS.onSurface, marginBottom: SPACING.md },
  progressHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  percent: { fontSize: 16 },
  progressTrack: {
    height: 8, backgroundColor: COLORS.surfaceContainer,
    borderRadius: RADIUS.full, overflow: "hidden",
  },
  progressFill: { height: "100%", borderRadius: RADIUS.full },
  daysLeft: { fontSize: 14, fontWeight: "600", textAlign: "right" },
  detailRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  detailIcon: { marginRight: 12 },
  detailLabel: { fontSize: 15, color: COLORS.onSurfaceVariant, width: 100 },
  detailValue: { fontSize: 15, color: COLORS.onSurface, fontWeight: '500', flex: 1 },
});
