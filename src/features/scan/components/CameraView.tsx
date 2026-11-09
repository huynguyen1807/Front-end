import { useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CameraView as ExpoCamera, CameraCapturedPicture } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { ScanPhoto } from '../types/scan';

type Props = { onCapture: (photo: ScanPhoto) => void; onError: (message: string) => void };

export default function CameraView({ onCapture, onError }: Props) {
  const camera = useRef<ExpoCamera>(null);
  const captureLock = useRef(false);
  const [ready, setReady] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [torch, setTorch] = useState(false);

  const capture = async () => {
    if (!ready || captureLock.current || !camera.current) return;
    captureLock.current = true;
    setCapturing(true);
    try {
      const photo: CameraCapturedPicture | undefined = await camera.current.takePictureAsync({ quality: 0.7, base64: false, exif: false });
      if (!photo?.uri) throw new Error('Camera chưa trả về ảnh. Vui lòng thử chụp lại.');
      // The parent immediately displays this captured image and unmounts the
      // live camera before doing compression, upload or AI work.
      onCapture({ uri: photo.uri, width: photo.width, height: photo.height, source: 'camera' });
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Chưa chụp được ảnh. Vui lòng thử lại.');
    } finally { captureLock.current = false; setCapturing(false); }
  };

  return (
    <View style={styles.container}>
      <ExpoCamera ref={camera} style={StyleSheet.absoluteFill} facing="back" mode="picture" enableTorch={torch}
        onCameraReady={() => setReady(true)} onMountError={() => { setReady(false); onError('Không mở được camera. Bạn vẫn có thể chọn ảnh từ thư viện.'); }} />
      <View style={styles.shade} pointerEvents="none" />
      <View style={styles.topRow}>
        <View style={styles.badge}><View style={styles.dot} /><Text style={styles.badgeText}>Một ảnh · Nhiều món</Text></View>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel={torch ? 'Tắt đèn flash' : 'Bật đèn flash'} onPress={() => setTorch(!torch)} style={styles.torch}>
          <Ionicons name={torch ? 'flash' : 'flash-off-outline'} size={20} color="white" />
        </TouchableOpacity>
      </View>
      <View style={styles.guide} pointerEvents="none">
        <View style={[styles.corner, styles.topLeft]} /><View style={[styles.corner, styles.topRight]} />
        <View style={[styles.corner, styles.bottomLeft]} /><View style={[styles.corner, styles.bottomRight]} />
      </View>
      <View style={styles.bottom}>
        <Text style={styles.hint}>Đặt các món tách nhau, đủ sáng{`\n`}và nằm trọn trong khung hình</Text>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Chụp ảnh và quét thực phẩm" disabled={!ready || capturing} onPress={capture} style={[styles.shutter, (!ready || capturing) && styles.disabled]}>
          <View style={styles.shutterInner}>{capturing ? <ActivityIndicator color="#006a44" /> : <Ionicons name="scan-outline" size={28} color="#006a44" />}</View>
        </TouchableOpacity>
        <Text style={styles.captureLabel}>{capturing ? 'Đang chụp ảnh…' : ready ? 'Chụp & quét' : 'Đang mở camera…'}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, minHeight: 340, backgroundColor: '#172a21', borderRadius: 26, overflow: 'hidden' },
  shade: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.08)' },
  topRow: { position: 'absolute', top: 16, left: 16, right: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  badge: { backgroundColor: 'rgba(12,28,20,0.72)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 7 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#b4ef8c' },
  badgeText: { fontSize: 11, fontWeight: '600', color: '#fff' },
  torch: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(12,28,20,0.6)', justifyContent: 'center', alignItems: 'center' },
  guide: { position: 'absolute', top: '22%', bottom: '40%', left: 26, right: 26 },
  corner: { position: 'absolute', width: 30, height: 30, borderColor: '#d0f5bc' },
  topLeft: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 14 },
  topRight: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 14 },
  bottomLeft: { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 14 },
  bottomRight: { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 14 },
  bottom: { marginTop: 'auto', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 20, paddingTop: 14, backgroundColor: 'rgba(12,28,20,0.65)' },
  hint: { color: 'white', fontSize: 12, lineHeight: 18, textAlign: 'center', marginBottom: 16 },
  shutter: { width: 74, height: 74, borderRadius: 37, borderWidth: 2, borderColor: 'white', padding: 5, justifyContent: 'center', alignItems: 'center' },
  shutterInner: { width: 60, height: 60, borderRadius: 30, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center' },
  captureLabel: { color: 'white', fontSize: 11, fontWeight: '600', marginTop: 9 },
  disabled: { opacity: 0.45 },
});
