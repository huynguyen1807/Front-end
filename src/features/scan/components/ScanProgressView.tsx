import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Image, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../../constants/colors';
import { ScanProgress, ScanStage } from '../types/scan';

const STAGES: Record<ScanStage, { title: string; subtitle: string }> = {
  preparing: { title: 'Chuẩn bị ảnh thật xinh', subtitle: 'Thu nhỏ ảnh, giữ đủ chi tiết để nhận diện.' },
  uploading: { title: 'Gửi ảnh vào căn bếp nhỏ', subtitle: 'Ảnh bạn vừa chụp đang được tải lên.' },
  queued: { title: 'Căn bếp đang chuẩn bị', subtitle: 'Lượt quét của bạn đang chờ được xử lý.' },
  recognizing: { title: 'Đang gọi tên từng món', subtitle: 'AI đang tìm các loại thực phẩm trong ảnh.' },
  enriching: { title: 'Sắp xếp vào đúng ngăn', subtitle: 'Đối chiếu danh mục và gợi ý bảo quản cho từng món.' },
  finishing: { title: 'Sắp xong rồi!', subtitle: 'Đang chuẩn bị danh sách để bạn kiểm tra.' },
  completed: { title: 'Đã tìm xong các món', subtitle: 'Kết quả của bạn đã sẵn sàng.' },
};

function KitchenFriends() {
  const motion = useRef(new Animated.Value(0)).current;
  const [reduceMotion, setReduceMotion] = useState(true);
  useEffect(() => {
    let mounted = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((value) => { if (mounted) setReduceMotion(value); });
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => { mounted = false; subscription.remove(); };
  }, []);
  useEffect(() => {
    if (reduceMotion) { motion.setValue(0); return; }
    const animation = Animated.loop(Animated.sequence([
      Animated.timing(motion, { toValue: 1, duration: 1100, useNativeDriver: Platform.OS !== 'web' }),
      Animated.timing(motion, { toValue: 0, duration: 1100, useNativeDriver: Platform.OS !== 'web' }),
    ]));
    animation.start();
    return () => { animation.stop(); motion.setValue(0); };
  }, [motion, reduceMotion]);
  return (
    <View style={styles.friends} accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <View style={styles.orbit} />
      <Animated.View style={[styles.carrot, { transform: [{ translateY: motion.interpolate({ inputRange: [0, 1], outputRange: [4, -7] }) }, { rotate: '-14deg' }] }]}>
        <MaterialCommunityIcons name="carrot" size={48} color="#d57839" />
      </Animated.View>
      <Animated.View style={[styles.bowlWrapper, { transform: [{ translateY: motion.interpolate({ inputRange: [0, 1], outputRange: [0, -9] }) }] }]}>
        <View style={styles.leaves}><Ionicons name="leaf" size={33} color="#659452" /><Ionicons name="leaf" size={27} color="#88ad68" style={{ transform: [{ rotate: '65deg' }] }} /></View>
        <View style={styles.bowl}>
          <View style={styles.face}><View style={styles.eye} /><View style={styles.smile} /><View style={styles.eye} /></View>
          <View style={styles.cheeks}><View style={styles.cheek} /><View style={styles.cheek} /></View>
        </View>
        <View style={styles.bowlRim} />
      </Animated.View>
      <Animated.View style={[styles.apple, { transform: [{ translateY: motion.interpolate({ inputRange: [0, 1], outputRange: [-5, 5] }) }, { rotate: '12deg' }] }]}>
        <MaterialCommunityIcons name="food-apple" size={44} color="#c86e65" />
      </Animated.View>
      <View style={styles.sparkle}><Ionicons name="sparkles" size={20} color="#ad8d32" /></View>
    </View>
  );
}

export default function ScanProgressView({ photoUri, progress, onCancel }: { photoUri: string; progress: ScanProgress; onCancel: () => void }) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => { const timer = setInterval(() => setElapsed((s) => s + 1), 1000); return () => clearInterval(timer); }, []);
  const stage = STAGES[progress.stage];
  const steps = [
    { label: 'Chuẩn bị ảnh', done: progress.percent >= 20 },
    { label: 'Nhận diện', done: progress.percent >= 75 },
    { label: 'Kết quả', done: progress.percent >= 100 },
  ];
  return (
    <View style={styles.container}>
      <View style={styles.photoRow}>
        <Image source={{ uri: photoUri }} style={styles.snapshot} resizeMode="cover" />
        <View style={styles.photoText}><Text style={styles.photoTitle}>Đang quét ảnh này</Text><Text style={styles.photoSubtitle}>Bạn có thể đặt điện thoại xuống rồi.</Text></View>
        <View style={styles.timeBadge}><Text style={styles.timeText}>{elapsed}s</Text></View>
      </View>
      <View style={styles.panel}>
        <KitchenFriends />
        <Text style={styles.eyebrow}>BẾP NHỎ ĐANG LÀM VIỆC</Text>
        <Text accessibilityLiveRegion="polite" style={styles.title}>{stage.title}</Text>
        <Text style={styles.subtitle}>{stage.subtitle}</Text>
        <View style={styles.progressRow}><Text style={styles.progressLabel}>Tiến trình xử lý</Text><Text style={styles.percentage}>{progress.percent}%</Text></View>
        <View style={styles.track} accessibilityRole="progressbar" accessibilityLabel="Tiến trình quét theo bước" accessibilityValue={{ min: 0, max: 100, now: progress.percent, text: `${progress.percent}% · ${stage.title}` }}>
          <View style={[styles.fill, { width: `${progress.percent}%` }]} />
        </View>
        <View style={styles.steps}>{steps.map((step) => (
          <View key={step.label} style={styles.step}><Ionicons name={step.done ? 'checkmark-circle' : 'ellipse-outline'} size={17} color={step.done ? COLORS.primary : COLORS.onSurfaceVariant} /><Text style={[styles.stepText, step.done && { color: COLORS.primary }]}>{step.label}</Text></View>
        ))}</View>
        <Text style={styles.progressNote}>Phần trăm cập nhật khi hoàn thành từng bước; thời gian AI xử lý có thể thay đổi.</Text>
        {elapsed >= 15 && <View style={styles.waitNote}><Ionicons name="information-circle-outline" size={18} color={COLORS.secondary} /><Text style={styles.waitText}>Lâu hơn một chút rồi. Bạn có thể huỷ và thử lại bằng chính ảnh này.</Text></View>}
      </View>
      <TouchableOpacity accessibilityRole="button" onPress={onCancel} style={styles.cancel}><Ionicons name="close" size={18} color={COLORS.onSurfaceVariant} /><Text style={styles.cancelText}>Huỷ quét · Giữ lại ảnh</Text></TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 16 },
  photoRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, backgroundColor: COLORS.surfaceContainerLowest, borderRadius: 20, borderWidth: 1, borderColor: COLORS.alpha(COLORS.outlineVariant, '40') },
  snapshot: { width: 64, height: 64, borderRadius: 13, backgroundColor: COLORS.surfaceContainer },
  photoText: { flex: 1 }, photoTitle: { fontSize: 13, fontWeight: '700', color: COLORS.onSurface },
  photoSubtitle: { fontSize: 11, lineHeight: 17, color: COLORS.onSurfaceVariant, marginTop: 4 },
  timeBadge: { borderRadius: 9, paddingHorizontal: 9, paddingVertical: 6, backgroundColor: COLORS.surfaceContainer }, timeText: { fontSize: 11, color: COLORS.onSurfaceVariant, fontVariant: ['tabular-nums'] },
  panel: { paddingHorizontal: 22, paddingBottom: 24, paddingTop: 12, borderRadius: 26, backgroundColor: COLORS.surfaceContainerLowest, borderWidth: 1, borderColor: COLORS.alpha(COLORS.outlineVariant, '40') },
  friends: { height: 170, width: 240, maxWidth: '100%', alignSelf: 'center', alignItems: 'center', justifyContent: 'center' },
  orbit: { position: 'absolute', width: 150, height: 150, borderRadius: 75, backgroundColor: COLORS.alpha(COLORS.primary, '04') },
  bowlWrapper: { width: 100, height: 106, marginTop: 20 },
  leaves: { flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-end', height: 38, marginBottom: -4 },
  bowl: { height: 62, backgroundColor: '#d8e9bf', borderBottomLeftRadius: 43, borderBottomRightRadius: 43, justifyContent: 'center' },
  bowlRim: { position: 'absolute', top: 34, left: -4, right: -4, height: 9, borderRadius: 5, backgroundColor: '#8eac72' },
  face: { flexDirection: 'row', gap: 10, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  eye: { width: 5, height: 7, borderRadius: 3, backgroundColor: '#35543a' },
  smile: { width: 13, height: 9, borderBottomWidth: 2, borderLeftWidth: 2, borderRightWidth: 2, borderColor: '#35543a', borderBottomLeftRadius: 9, borderBottomRightRadius: 9, marginTop: 8 },
  cheeks: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, marginTop: -1 }, cheek: { width: 11, height: 5, borderRadius: 6, backgroundColor: '#dca598' },
  carrot: { position: 'absolute', left: 14, top: 76 }, apple: { position: 'absolute', right: 13, top: 65 }, sparkle: { position: 'absolute', right: 44, top: 24 },
  eyebrow: { fontSize: 9, letterSpacing: 1.3, fontWeight: '700', color: COLORS.primary, textAlign: 'center', marginTop: 4 },
  title: { fontSize: 22, lineHeight: 29, fontWeight: '800', color: COLORS.onSurface, textAlign: 'center', marginTop: 8, letterSpacing: -0.4 },
  subtitle: { fontSize: 12, lineHeight: 19, color: COLORS.onSurfaceVariant, textAlign: 'center', marginTop: 8, minHeight: 38 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 22, marginBottom: 10 },
  progressLabel: { fontSize: 12, color: COLORS.onSurfaceVariant }, percentage: { fontSize: 22, fontWeight: '800', color: COLORS.primary, fontVariant: ['tabular-nums'] },
  track: { height: 8, borderRadius: 4, backgroundColor: COLORS.surfaceContainer, overflow: 'hidden' }, fill: { height: '100%', borderRadius: 4, backgroundColor: COLORS.primary },
  steps: { flexDirection: 'row', justifyContent: 'space-between', gap: 6, marginTop: 16 }, step: { flexDirection: 'row', alignItems: 'center', gap: 4, flexShrink: 1 }, stepText: { fontSize: 10, color: COLORS.onSurfaceVariant, flexShrink: 1 },
  progressNote: { fontSize: 10, lineHeight: 16, color: COLORS.onSurfaceVariant, textAlign: 'center', marginTop: 18 },
  waitNote: { marginTop: 16, padding: 12, borderRadius: 13, backgroundColor: COLORS.alpha(COLORS.secondary, '18'), flexDirection: 'row', gap: 8, alignItems: 'center' }, waitText: { flex: 1, fontSize: 11, lineHeight: 17, color: COLORS.onSurface },
  cancel: { minHeight: 48, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16 }, cancelText: { fontSize: 12, fontWeight: '600', color: COLORS.onSurfaceVariant },
});
