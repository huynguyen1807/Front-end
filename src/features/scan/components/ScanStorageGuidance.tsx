import { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../../../constants/colors';
import { ScanDraftItem, StorageAdvice, StorageGuide } from '../types/scan';
import { fetchStorageAdvice } from '../services/scanBatchApi';

export default function ScanStorageGuidance({ item, onPatch, onApply }: { item: ScanDraftItem; onPatch: (changes: Partial<ScanDraftItem>) => void; onApply: (guide: StorageGuide) => void }) {
  const key = JSON.stringify([item.foodName, item.foodState, item.storageType, item.storageProfile, item.packaging]);
  const [resolved, setResolved] = useState<{ key: string; advice?: StorageAdvice; error?: string } | null>(null);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      void fetchStorageAdvice(item).then((advice) => { if (active) setResolved({ key, advice }); }).catch((error) => { if (active) setResolved({ key, error: error instanceof Error ? error.message : 'Chưa tải được hướng dẫn.' }); });
    }, 250);
    return () => { active = false; clearTimeout(timer); };
  }, [key, retry]);
  const current = resolved?.key === key ? resolved : null;
  const advice = current?.advice, guide = advice?.guide;
  return <View style={styles.panel}>
    <Text style={styles.title}>Chọn điều kiện → xem mốc nhắc</Text>
    {!current ? <View style={styles.loading}><ActivityIndicator color={COLORS.primary} /><Text style={styles.text}>Đang tra hướng dẫn bảo quản…</Text></View> : current.error ? <><Text style={styles.text}>{current.error}</Text><Pressable accessibilityRole="button" onPress={() => { setResolved(null); setRetry((value) => value + 1); }} style={styles.button}><Text style={styles.action}>Tra lại hướng dẫn</Text></Pressable></> : <>
      <Text style={styles.text}>{advice?.message}</Text>
      {!!advice?.profiles?.length && <View style={styles.choices}>{advice.profiles.map((profile) => <Pressable key={profile.value} accessibilityRole="radio" accessibilityState={{ checked: item.storageProfile === profile.value }} onPress={() => onPatch({ storageProfile: profile.value })} style={[styles.choice, item.storageProfile === profile.value && styles.active]}><Text style={styles.action}>{profile.label}</Text></Pressable>)}</View>}
      {!!advice?.profiles?.length && !item.storageProfile && <Text style={styles.hint}>Chọn loại/trạng thái ở trên để tra mốc phù hợp.</Text>}
      {guide ? <>
        <Text style={styles.title}>{guide.label}</Text><Text style={styles.range}>{guide.minDays === guide.maxDays ? guide.minDays : `${guide.minDays}–${guide.maxDays}`} ngày · {guide.temperature}</Text>
        <Text style={styles.hint}>{guide.dateAnchor === 'PURCHASE' ? 'Tính từ ngày mua của lô.' : 'Kiểm tra ngày bắt đầu bảo quản / mở gói / cắt bên dưới trước khi áp dụng.'}</Text>
        <Text style={styles.text}>{guide.conditions}</Text>
        <Pressable accessibilityRole="link" onPress={() => void Linking.openURL(guide.sourceUrl)} style={styles.button}><Text style={styles.action}>Nguồn: {guide.sourceLabel || 'FoodSafety.gov'} ↗</Text></Pressable>
        <Pressable accessibilityRole="button" onPress={() => onApply(guide)} style={styles.apply}><Text style={styles.action}>Dùng mốc {guide.minDays} ngày để nhắc kiểm tra</Text></Pressable>
        <Text style={styles.hint}>Bấm áp dụng mới điền ngày. Hạn trên bao bì đã nhập được giữ nguyên.</Text>
      </> : <>
        {advice?.recommendedStorage === 'REFRIGERATOR' && item.storageType !== 'REFRIGERATOR' && <Pressable accessibilityRole="button" onPress={() => onPatch({ storageType: 'REFRIGERATOR' })} style={styles.apply}><Text style={styles.action}>Chuyển sang tủ mát để tra mốc</Text></Pressable>}
        <Text style={styles.hint}>Chưa đủ điều kiện để điền ngày tự động. Kiểm tra loại ở trên và mục “Bao gói / chia phần”; ưu tiên nhãn sản phẩm. Có thể bỏ tick món này để lưu các món khác trước.</Text>
      </>}
    </>}
  </View>;
}
const styles = StyleSheet.create({
  panel: { gap: 10, padding: 14, borderRadius: 16, backgroundColor: COLORS.alpha(COLORS.primary, '04') }, title: { fontSize: 13, fontWeight: '700', color: COLORS.onSurface }, text: { color: COLORS.onSurfaceVariant, fontSize: 12, lineHeight: 19 }, hint: { color: COLORS.onSurfaceVariant, fontSize: 11, lineHeight: 18 }, range: { fontSize: 15, fontWeight: '700', color: COLORS.primary }, loading: { flexDirection: 'row', alignItems: 'center', gap: 8 }, choices: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, choice: { minHeight: 44, justifyContent: 'center', borderWidth: 1, borderColor: COLORS.outlineVariant, borderRadius: 12, padding: 10 }, active: { borderColor: COLORS.primary, backgroundColor: COLORS.alpha(COLORS.primary, '10') }, action: { color: COLORS.primary, fontSize: 12, fontWeight: '600', flexShrink: 1 }, button: { minHeight: 44, justifyContent: 'center' }, apply: { minHeight: 48, justifyContent: 'center', alignItems: 'center', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: COLORS.primary },
});
