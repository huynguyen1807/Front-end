import React, { useState } from 'react';
import { Image, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../../constants/colors';
import { formatFoodAmount } from '../../../utils/foodUnits';
import { FoodItem } from '../types/inventory';
import { getFoodStatusConfig, getCategoryDisplayName, getDaysLeft } from '../utils/inventoryDisplay';

type Props = {
  item: FoodItem;
  onPress: () => void;
  onEdit: () => void;
  onConsume: () => void;
  onDelete: () => void;
};

export default function InventoryGridCard({ item, onPress, onEdit, onConsume, onDelete }: Props) {
  const [menuVisible, setMenuVisible] = useState(false);
  const [failedImage, setFailedImage] = useState<string | null>(null);
  const status = getFoodStatusConfig(item);
  const days = getDaysLeft(item.expiryDate);
  const expiryLabel = item.expiryBasis === 'REFERENCE' ? days <= 0 ? 'Đến mốc kiểm tra' : `Kiểm tra sau ${days} ngày` : !Number.isFinite(days) ? 'Chưa có hạn dùng'
    : days < 0 ? `Quá hạn ${Math.abs(days)} ngày`
    : days === 0 ? 'Hết hạn hôm nay'
    : days === 1 ? 'Còn 1 ngày' : `Còn ${days} ngày`;
  const expiryColor = item.status === 'EXPIRED' || days <= 0 ? COLORS.tertiary
    : item.status === 'NEAR_EXPIRY' ? COLORS.secondary : COLORS.onSurfaceVariant;

  const actions = [
    { label: 'Chỉnh sửa', icon: 'create-outline' as const, run: onEdit },
    { label: 'Đánh dấu đã dùng', icon: 'checkmark-circle-outline' as const, run: onConsume },
    { label: 'Xoá thực phẩm', icon: 'trash-outline' as const, run: onDelete, danger: true },
  ];

  return (
    <View style={styles.card}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${item.foodName}, ${formatFoodAmount(item.quantity, item.unit)}, ${status.label}, ${expiryLabel}`}
        style={({ pressed }) => [styles.details, pressed && styles.pressed]}
      >
        <View style={styles.imageContainer}>
          {item.imageUrl && item.imageUrl !== failedImage ? (
            <Image source={{ uri: item.imageUrl }} style={styles.image} resizeMode="cover" onError={() => setFailedImage(item.imageUrl ?? null)} />
          ) : (
            <View style={styles.placeholder}>
              <Ionicons name="nutrition-outline" size={36} color={COLORS.primary} />
            </View>
          )}
          <View style={styles.quantityBadge}>
            <Text numberOfLines={1} style={styles.quantity}>{formatFoodAmount(item.quantity, item.unit)}</Text>
          </View>
        </View>
        <View style={styles.body}>
          <Text style={styles.category} numberOfLines={1}>{getCategoryDisplayName(item.categoryId)}</Text>
          <Text style={styles.name} numberOfLines={2}>{item.foodName}</Text>
          <View style={styles.status}>
            <View style={[styles.statusDot, { backgroundColor: status.color }]} />
            <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
          </View>
        </View>
      </Pressable>
      <View style={styles.footer}>
        <View style={styles.expiry}>
          <Ionicons name="time-outline" size={13} color={expiryColor} />
          <Text style={[styles.expiryText, { color: expiryColor }]}>{expiryLabel}</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Tuỳ chọn cho ${item.foodName}`}
          onPress={() => setMenuVisible(true)}
          style={({ pressed }) => [styles.menuButton, pressed && styles.pressed]}
        >
          <Ionicons name="ellipsis-horizontal" size={20} color={COLORS.onSurfaceVariant} />
        </Pressable>
      </View>
      {menuVisible && (
        <Modal transparent animationType="fade" visible onRequestClose={() => setMenuVisible(false)}>
          <View style={styles.modalContainer}>
            <Pressable style={styles.scrim} onPress={() => setMenuVisible(false)} accessibilityRole="button" accessibilityLabel="Đóng tuỳ chọn" />
            <View style={styles.menu} accessibilityViewIsModal>
              <View style={styles.menuHeading}>
                <Text style={styles.menuTitle} numberOfLines={2}>{item.foodName}</Text>
                <Pressable style={styles.menuButton} onPress={() => setMenuVisible(false)} accessibilityRole="button" accessibilityLabel="Đóng">
                  <Ionicons name="close" size={22} color={COLORS.onSurface} />
                </Pressable>
              </View>
              {actions.map((action) => (
                <Pressable
                  key={action.label}
                  accessibilityRole="button"
                  style={({ pressed }) => [styles.action, pressed && styles.pressed]}
                  onPress={() => { setMenuVisible(false); action.run(); }}
                >
                  <Ionicons name={action.icon} size={21} color={action.danger ? COLORS.tertiary : COLORS.primary} />
                  <Text style={[styles.actionText, action.danger && { color: COLORS.tertiary }]}>{action.label}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, minWidth: 0, backgroundColor: COLORS.surfaceContainerLowest, borderRadius: 16, borderWidth: 1, borderColor: COLORS.alpha(COLORS.outlineVariant, '40'), overflow: 'hidden' },
  details: { flex: 1 },
  pressed: { opacity: 0.65 },
  imageContainer: { aspectRatio: 1.45, maxHeight: 170, width: '100%', backgroundColor: COLORS.surfaceContainer, overflow: 'hidden' },
  image: { width: '100%', height: '100%' },
  placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.alpha(COLORS.primary, '04') },
  quantityBadge: { position: 'absolute', bottom: 8, left: 8, right: 8, alignItems: 'flex-start' },
  quantity: { maxWidth: '100%', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: COLORS.surfaceContainerLowest, fontSize: 11, fontWeight: '700', color: COLORS.onSurface },
  body: { paddingHorizontal: 12, paddingTop: 12, paddingBottom: 8, gap: 5 },
  category: { fontSize: 10, fontWeight: '500', color: COLORS.onSurfaceVariant },
  name: { minHeight: 40, fontSize: 15, lineHeight: 20, fontWeight: '700', color: COLORS.onSurface },
  status: { flexDirection: 'row', alignItems: 'center', gap: 5, minHeight: 20 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: '600', flexShrink: 1 },
  footer: { minHeight: 44, borderTopWidth: 1, borderTopColor: COLORS.alpha(COLORS.outlineVariant, '30'), paddingLeft: 10, flexDirection: 'row', alignItems: 'center' },
  expiry: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 6 },
  expiryText: { flexShrink: 1, fontSize: 10, lineHeight: 14, fontWeight: '500' },
  menuButton: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  modalContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  scrim: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(12, 28, 20, 0.45)' },
  menu: { width: '100%', maxWidth: 380, borderRadius: 24, padding: 16, backgroundColor: COLORS.surfaceContainerLowest },
  menuHeading: { flexDirection: 'row', alignItems: 'center', paddingLeft: 10, marginBottom: 8 },
  menuTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: COLORS.onSurface },
  action: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, minHeight: 52, borderRadius: 12 },
  actionText: { fontSize: 15, fontWeight: '500', color: COLORS.onSurface },
});
