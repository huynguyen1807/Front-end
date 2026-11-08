import { useMemo, useRef, useState } from 'react';
import { Image, Modal, PanResponder, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../../constants/colors';
import { BoundingBox, ScanBatch } from '../types/scan';

export function CropThumbnail({ source, box, size = 82 }: { source: ScanBatch; box?: BoundingBox; size?: number }) {
  if (!box) return <View style={[styles.placeholder, { width: size, height: size }]}><Ionicons name="image-outline" size={25} color={COLORS.onSurfaceVariant} /><Text style={styles.placeholderText}>Chọn ảnh riêng</Text></View>;
  const width = source.width * (box[3] - box[1]) / 1000, height = source.height * (box[2] - box[0]) / 1000;
  const scale = Math.min(size / width, size / height);
  return <View style={[styles.thumbnail, { width: size, height: size }]}><Image source={{ uri: source.imageUrl }} resizeMode="stretch" style={{ position: 'absolute', width: source.width * scale, height: source.height * scale, left: (size - width * scale) / 2 - box[1] * source.width * scale / 1000, top: (size - height * scale) / 2 - box[0] * source.height * scale / 1000 }} /></View>;
}

export default function ScanCropEditor({ source, initialBox, onClose, onConfirm }: { source: ScanBatch; initialBox?: BoundingBox; onClose: () => void; onConfirm: (box: BoundingBox) => void }) {
  const { width: screenWidth } = useWindowDimensions();
  const width = Math.min(screenWidth - 64, 480, 360 * source.width / source.height);
  const height = width * source.height / source.width;
  const [box, setBox] = useState<BoundingBox | undefined>(initialBox);
  const start = useRef({ x: 0, y: 0 });
  const clamp = (value: number) => Math.max(0, Math.min(1000, value));
  const responder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (event) => {
      const x = clamp(event.nativeEvent.locationX / width * 1000), y = clamp(event.nativeEvent.locationY / height * 1000);
      start.current = { x, y }; setBox([y, x, y, x]);
    },
    onPanResponderMove: (_event, gesture) => {
      const x = clamp(start.current.x + gesture.dx / width * 1000), y = clamp(start.current.y + gesture.dy / height * 1000);
      setBox([Math.min(start.current.y, y), Math.min(start.current.x, x), Math.max(start.current.y, y), Math.max(start.current.x, x)]);
    },
    onPanResponderTerminationRequest: () => false,
  }), [width, height]);
  const valid = box && box[2] - box[0] >= 10 && box[3] - box[1] >= 10;
  return <Modal visible transparent animationType="fade" onRequestClose={onClose}><View style={styles.modal}>
    <Pressable style={styles.scrim} onPress={onClose} accessibilityRole="button" accessibilityLabel="Đóng chọn vùng ảnh" />
    <View style={styles.panel} accessibilityViewIsModal>
      <View style={styles.heading}><View style={{ flex: 1 }}><Text style={styles.title}>Ảnh đúng món này</Text><Text style={styles.subtitle}>Kéo từ một góc đến góc đối diện để khoanh món. Ảnh tổng vẫn được giữ.</Text></View><Pressable onPress={onClose} style={styles.close} accessibilityRole="button" accessibilityLabel="Đóng"><Ionicons name="close" size={23} color={COLORS.onSurface} /></Pressable></View>
      <View style={{ width, height, alignSelf: 'center', backgroundColor: COLORS.surfaceContainer, overflow: 'hidden' }} {...responder.panHandlers}>
        <Image pointerEvents="none" source={{ uri: source.imageUrl }} style={StyleSheet.absoluteFill} resizeMode="stretch" />
        {box && <View pointerEvents="none" style={{ position: 'absolute', left: box[1] / 1000 * width, top: box[0] / 1000 * height, width: (box[3] - box[1]) / 1000 * width, height: (box[2] - box[0]) / 1000 * height, borderWidth: 3, borderColor: '#b7f0a1', backgroundColor: 'rgba(0,106,68,0.12)' }} />}
      </View>
      <View style={styles.actions}><Pressable onPress={() => setBox(initialBox)} style={styles.secondary} accessibilityRole="button"><Text style={styles.secondaryText}>Đặt lại vùng AI</Text></Pressable><Pressable disabled={!valid} onPress={() => valid && onConfirm(box!)} style={[styles.primary, !valid && { opacity: 0.4 }]} accessibilityRole="button"><Text style={styles.primaryText}>Dùng ảnh cắt này</Text></Pressable></View>
    </View>
  </View></Modal>;
}
const styles = StyleSheet.create({
  thumbnail: { borderRadius: 14, backgroundColor: COLORS.surfaceContainer, overflow: 'hidden' },
  placeholder: { borderRadius: 14, backgroundColor: COLORS.surfaceContainer, justifyContent: 'center', alignItems: 'center', gap: 5 }, placeholderText: { fontSize: 9, color: COLORS.onSurfaceVariant, textAlign: 'center' },
  modal: { flex: 1, padding: 20, alignItems: 'center', justifyContent: 'center' }, scrim: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(15,30,20,0.7)' },
  panel: { width: '100%', maxWidth: 540, padding: 16, borderRadius: 24, backgroundColor: COLORS.surfaceContainerLowest }, heading: { flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 18 }, title: { fontSize: 19, fontWeight: '700', color: COLORS.onSurface }, subtitle: { fontSize: 12, lineHeight: 18, color: COLORS.onSurfaceVariant, marginTop: 5 }, close: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  actions: { flexDirection: 'row', gap: 10, marginTop: 16 }, secondary: { flex: 1, minHeight: 46, alignItems: 'center', justifyContent: 'center' }, secondaryText: { color: COLORS.onSurfaceVariant, fontSize: 12, fontWeight: '600' }, primary: { flex: 1, minHeight: 46, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primary, borderRadius: 12 }, primaryText: { color: COLORS.onPrimary, fontSize: 12, fontWeight: '700' },
});
