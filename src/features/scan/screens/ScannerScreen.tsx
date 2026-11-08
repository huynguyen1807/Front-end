import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Image, Linking, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import ScreenContainer from '../../../components/layout/ScreenContainer';
import BottomNavbar from '../../../components/layout/BottomNavbar';
import TopNavbar from '../../../components/layout/TopNavbar';
import CameraView from '../components/CameraView';
import ScanProgressView from '../components/ScanProgressView';
import ScanResultCard, { ScanReviewHandle } from '../components/ScanResultCard';
import { ScanPhoto, ScanProgress, ScanReviewSession } from '../types/scan';
import { COLORS } from '../../../constants/colors';
import { useAppDispatch, useAppSelector } from '../../../redux/hooks';
import { InventoryOwnerContext } from '../../inventory/types/inventory';
import { validateImage } from '../utils/scanUtils';
import { scanPhoto } from '../services/scanApi';
import { appendScan, createReview, manualDraft } from '../utils/scanReview';
import { fetchFoods, fetchSummary } from '../../inventory/redux/inventorySlice';
import { useScanDraft } from '../hooks/useScanDraft';

type Mode = 'camera' | 'processing' | 'preview' | 'error' | 'results';

export default function ScannerScreen() {
  const navigation = useNavigation<any>();
  const dispatch = useAppDispatch();
  const isFocused = useIsFocused();
  const { height } = useWindowDimensions();
  const inventoryContext = useAppSelector((state) => state.inventory.context);
  const activeFilter = useAppSelector((state) => state.inventory.activeFilter);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [mode, setMode] = useState<Mode>('camera');
  const [photo, setPhoto] = useState<ScanPhoto | null>(null);
  const [review, setReview] = useState<ScanReviewSession | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<ScanProgress>({ stage: 'preparing', percent: 2 });
  const [picking, setPicking] = useState(false);
  const [saveState, setSaveState] = useState({ saving: false, stage: '' });
  const reviewHandle = useRef<ScanReviewHandle>(null);
  const controller = useRef<AbortController | null>(null);
  const runId = useRef(0);
  const mounted = useRef(true);
  const pickerLock = useRef(false);
  const photoContext = useRef<InventoryOwnerContext>({ ...inventoryContext });
  const pendingRescan = useRef<string | null>(null);
  const persistedSources = useRef(new Set<string>());
  const draftState = useScanDraft(review, (draft) => { if (runId.current === 0) { setReview(draft); setMode('results'); } });

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; runId.current++; controller.current?.abort(); };
  }, []);

  const startScan = async (captured: ScanPhoto, context: InventoryOwnerContext = { ...(review?.root.inventoryContext ?? inventoryContext) }) => {
    controller.current?.abort();
    const id = ++runId.current;
    const nextController = new AbortController();
    controller.current = nextController;
    photoContext.current = { ...context };
    setPhoto(captured);
    setError(null);
    const replaceTarget = pendingRescan.current;
    const validation = validateImage(captured.uri);
    if (!validation.valid) { setError(validation.error!); setMode('error'); return; }
    setProgress({ stage: 'preparing', percent: 2 });
    setMode('processing');
    try {
      const result = await scanPhoto(captured, context, nextController.signal, (update) => {
        if (mounted.current && runId.current === id && !nextController.signal.aborted) setProgress((current) => ({ ...update, percent: Math.max(current.percent, update.percent) }));
      });
      if (!mounted.current || runId.current !== id || nextController.signal.aborted) return;
      setReview((current) => current && replaceTarget ? appendScan(current, result, replaceTarget === 'append' ? undefined : replaceTarget) : createReview(result));
      pendingRescan.current = null;
      setMode('results');
    } catch (failure) {
      if (!mounted.current || runId.current !== id || nextController.signal.aborted) return;
      setError(failure instanceof Error ? failure.message : 'Chưa quét được ảnh. Vui lòng thử lại.');
      setMode('error');
    }
  };

  const cancelScan = () => {
    runId.current++;
    controller.current?.abort();
    setMode('preview');
    setError(null);
  };

  const reset = () => {
    runId.current++;
    controller.current?.abort();
    setPhoto(null); setReview(null); setError(null); setMode('camera'); pendingRescan.current = null; persistedSources.current.clear();
  };

  const rescanItem = (replaceId?: string) => {
    pendingRescan.current = replaceId ?? 'append';
    setPhoto(null); setError(null); setMode('camera');
  };
  const returnToReview = () => { runId.current++; controller.current?.abort(); pendingRescan.current = null; setError(null); setMode('results'); };
  const newBatch = () => {
    if (!review?.items.some((item) => !item.saved)) { reset(); return; }
    const message = 'Những món chưa lưu sẽ được bỏ khỏi danh sách duyệt. Bắt đầu lô mua khác?';
    if (Platform.OS === 'web') { if (window.confirm(message)) reset(); }
    else Alert.alert('Còn món chưa lưu', message, [{ text: 'Quay lại', style: 'cancel' }, { text: 'Bắt đầu lô mới', onPress: reset }]);
  };
  const inventorySaved = () => {
    if (!review || review.root.inventoryContext.ownerType !== inventoryContext.ownerType || review.root.inventoryContext.householdId !== inventoryContext.householdId) return;
    void dispatch(fetchFoods(activeFilter === 'all' ? undefined : activeFilter)); void dispatch(fetchSummary());
  };

  const pickImage = async () => {
    if (pickerLock.current) return;
    pickerLock.current = true;
    setPicking(true); setError(null);
    try {
      // The system image picker works independently from camera permission.
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: false, allowsMultipleSelection: false, quality: 0.8, exif: false });
      if (!mounted.current || result.canceled || !result.assets[0]) return;
      const asset = result.assets[0];
      void startScan({ uri: asset.uri, width: asset.width, height: asset.height, source: 'library' });
    } catch {
      if (mounted.current) setError('Không mở được thư viện. Vui lòng kiểm tra quyền truy cập ảnh và thử lại.');
    } finally {
      pickerLock.current = false;
      if (mounted.current) setPicking(false);
    }
  };

  const galleryButton = (
    <TouchableOpacity accessibilityRole="button" disabled={picking} onPress={pickImage} style={[styles.gallery, picking && { opacity: 0.5 }]}>
      <View style={styles.galleryIcon}>{picking ? <ActivityIndicator color={COLORS.primary} /> : <Ionicons name="images-outline" size={23} color={COLORS.primary} />}</View>
      <View style={{ flex: 1 }}><Text style={styles.galleryTitle}>{picking ? 'Đang mở thư viện…' : 'Chọn ảnh từ thư viện'}</Text><Text style={styles.gallerySubtitle}>Đã chụp sẵn? Dùng luôn ảnh của bạn.</Text></View>
      <Ionicons name="chevron-forward" size={18} color={COLORS.onSurfaceVariant} />
    </TouchableOpacity>
  );

  return (
    <ScreenContainer>
      <TopNavbar />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={styles.heading}>
            <View style={{ flex: 1 }}><Text style={styles.eyebrow}>MỘT ẢNH, NHIỀU THỰC PHẨM</Text><Text style={styles.title}>{mode === 'results' ? 'Kết quả quét' : 'Quét thực phẩm'}</Text><Text style={styles.subtitle}>{mode === 'processing' ? 'Đã chụp xong. Bếp nhỏ đang nhận diện giúp bạn.' : 'Chụp hoặc chọn ảnh, để AI giúp bạn gọi tên từng món.'}</Text></View>
            <View style={styles.headingIcon}><Ionicons name="scan-outline" size={26} color={COLORS.primary} /></View>
          </View>

          {draftState.warning && <View style={styles.error}><Text style={styles.errorText}>{draftState.warning}</Text></View>}

          {review && mode !== 'results' && <TouchableOpacity accessibilityRole="button" onPress={returnToReview} style={styles.secondary}><Ionicons name="arrow-back" size={18} color={COLORS.primary} /><Text style={styles.secondaryText}>Quay lại danh sách {review.items.length} món · Không mất món đã chọn</Text></TouchableOpacity>}

          {!draftState.ready ? <View style={styles.secondary}><ActivityIndicator color={COLORS.primary} /><Text style={styles.secondaryText}>Đang khôi phục lô mua nháp…</Text></View> : mode === 'processing' && photo ? (
            <ScanProgressView key={runId.current} photoUri={photo.uri} progress={progress} onCancel={cancelScan} />
          ) : mode === 'results' && review ? (
            <ScanResultCard ref={reviewHandle} key={review.root.scanResultId} review={review} onChange={setReview} onRescan={rescanItem} onNewBatch={newBatch} onSaved={inventorySaved} persistedSources={persistedSources.current} onSaveState={setSaveState} />
          ) : photo && (mode === 'preview' || mode === 'error') ? (
            <View style={styles.previewPanel}>
              <View style={styles.previewHeader}><Ionicons name="image-outline" size={18} color={COLORS.primary} /><Text style={styles.previewTitle}>Ảnh của bạn đã được giữ lại</Text></View>
              <Image source={{ uri: photo.uri }} style={styles.previewImage} resizeMode="contain" />
              {error && <View style={styles.error}><Ionicons name="alert-circle-outline" size={21} color={COLORS.error} /><Text accessibilityLiveRegion="polite" style={styles.errorText}>{error}</Text></View>}
              <TouchableOpacity accessibilityRole="button" onPress={() => void startScan(photo, photoContext.current)} style={styles.primary}><Ionicons name="scan-outline" size={20} color={COLORS.onPrimary} /><Text style={styles.primaryText}>{mode === 'error' ? 'Thử quét lại ảnh này' : 'Quét ảnh này'}</Text></TouchableOpacity>
              {galleryButton}
              <TouchableOpacity accessibilityRole="button" onPress={() => { setPhoto(null); setError(null); setMode('camera'); }} style={styles.secondary}><Ionicons name="camera-outline" size={18} color={COLORS.onSurfaceVariant} /><Text style={styles.secondaryText}>Chụp ảnh khác</Text></TouchableOpacity>
              <TouchableOpacity accessibilityRole="button" onPress={() => {
                if (review) { setReview((current) => current ? { ...current, items: [...current.items, manualDraft(current)] } : current); returnToReview(); }
                else navigation.navigate('AddFood', { prefill: { ...photoContext.current } });
              }} style={styles.secondary}><Text style={styles.secondaryText}>Nhập thực phẩm thủ công</Text><Ionicons name="arrow-forward" size={15} color={COLORS.onSurfaceVariant} /></TouchableOpacity>
            </View>
          ) : (
            <View style={{ gap: 14 }}>
              {error && <View style={styles.error}><Ionicons name="alert-circle-outline" size={21} color={COLORS.error} /><Text accessibilityLiveRegion="polite" style={styles.errorText}>{error}</Text></View>}
              <View style={{ height: Math.min(480, Math.max(340, height * 0.5)) }}>
                {cameraPermission?.granted && isFocused ? <CameraView onCapture={(captured) => void startScan(captured)} onError={setError} /> : (
                  <View style={styles.permission}>
                    <View style={styles.permissionIcon}><Ionicons name="camera-outline" size={38} color={COLORS.primary} /></View>
                    <Text style={styles.permissionTitle}>Cùng xem hôm nay có gì nhé!</Text><Text style={styles.permissionText}>Bật camera để chụp thực phẩm.{`\n`}Bạn cũng có thể dùng ảnh từ thư viện bên dưới.</Text>
                    <TouchableOpacity accessibilityRole="button" onPress={() => {
                      if (!cameraPermission || cameraPermission.canAskAgain) void requestCameraPermission().catch(() => setError('Chưa mở được quyền camera. Bạn vẫn có thể dùng ảnh từ thư viện.'));
                      else if (Platform.OS !== 'web') void Linking.openSettings();
                      else setError('Camera đã bị chặn. Hãy cho phép camera trong cài đặt trang web hoặc chọn ảnh từ thư viện.');
                    }} style={styles.primary}><Ionicons name="camera-outline" size={20} color={COLORS.onPrimary} /><Text style={styles.primaryText}>{cameraPermission?.canAskAgain === false && Platform.OS !== 'web' ? 'Mở cài đặt camera' : 'Bật camera'}</Text></TouchableOpacity>
                  </View>
                )}
              </View>
              {galleryButton}
              <View style={styles.tip}><Ionicons name="sparkles-outline" size={18} color={COLORS.primary} /><Text style={styles.tipText}>Chụp tối đa 12 loại thực phẩm trong một ảnh. Tránh xếp chồng để AI nhìn rõ từng món.</Text></View>
              <View style={styles.tip}><Ionicons name="bag-handle-outline" size={18} color={COLORS.primary} /><Text style={styles.tipText}>Túi che kín? Xếp từng gói riêng và hướng nhãn ra camera, không cần mở bao kín của nhà sản xuất chỉ để quét. Món không nhìn rõ có thể thêm tay hoặc chụp bổ sung.</Text></View>
            </View>
          )}
        </View>
      </ScrollView>
      {mode === 'results' && review && <View style={styles.bulkBar}>
        <View style={{ flex: 1 }}><Text style={styles.bulkCount}>{review.items.filter((item) => item.selected && !item.saved).length} món đã chọn</Text><Text style={styles.bulkHint}>{saveState.saving ? saveState.stage : review.items.some((item) => item.selected && item.error) ? 'Có món cần kiểm tra lại trong danh sách' : 'Bỏ tick món chưa đúng · Lưu cùng lúc'}</Text></View>
        <TouchableOpacity accessibilityRole="button" disabled={saveState.saving || !review.items.some((item) => item.selected && !item.saved)} onPress={() => void reviewHandle.current?.save()} style={[styles.bulkSave, (saveState.saving || !review.items.some((item) => item.selected && !item.saved)) && { opacity: 0.5 }]}>{saveState.saving ? <ActivityIndicator color={COLORS.onPrimary} /> : <Ionicons name="checkmark-done" size={20} color={COLORS.onPrimary} />}<Text style={styles.primaryText}>{saveState.saving ? 'Đang lưu' : 'Thêm đã chọn'}</Text></TouchableOpacity>
      </View>}
      <BottomNavbar />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  bulkBar: { width: '100%', maxWidth: 760, alignSelf: 'center', paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 12, borderTopWidth: 1, borderTopColor: COLORS.alpha(COLORS.outlineVariant, '40'), backgroundColor: COLORS.surfaceContainerLowest },
  bulkCount: { fontSize: 14, fontWeight: '700', color: COLORS.onSurface }, bulkHint: { fontSize: 10, lineHeight: 16, color: COLORS.onSurfaceVariant, marginTop: 3 }, bulkSave: { minHeight: 48, paddingHorizontal: 14, borderRadius: 14, backgroundColor: COLORS.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  scroll: { flexGrow: 1, paddingBottom: 28 }, content: { width: '100%', maxWidth: 760, alignSelf: 'center', paddingHorizontal: 20, paddingTop: 22 },
  heading: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 22 }, eyebrow: { fontSize: 9, fontWeight: '700', color: COLORS.primary, letterSpacing: 1.25, marginBottom: 7 }, title: { fontSize: 28, fontWeight: '800', lineHeight: 35, letterSpacing: -0.7, color: COLORS.onSurface }, subtitle: { fontSize: 12, lineHeight: 19, color: COLORS.onSurfaceVariant, marginTop: 6 }, headingIcon: { width: 50, height: 50, borderRadius: 17, backgroundColor: COLORS.alpha(COLORS.primary, '04'), alignItems: 'center', justifyContent: 'center' },
  gallery: { minHeight: 80, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 20, borderWidth: 1, borderColor: COLORS.alpha(COLORS.outlineVariant, '40'), backgroundColor: COLORS.surfaceContainerLowest }, galleryIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.alpha(COLORS.primary, '04') }, galleryTitle: { fontSize: 14, fontWeight: '700', color: COLORS.onSurface }, gallerySubtitle: { fontSize: 11, lineHeight: 17, color: COLORS.onSurfaceVariant, marginTop: 4 },
  permission: { flex: 1, padding: 24, borderRadius: 26, backgroundColor: COLORS.surfaceContainerLowest, borderWidth: 1, borderColor: COLORS.alpha(COLORS.outlineVariant, '40'), alignItems: 'center', justifyContent: 'center' }, permissionIcon: { width: 80, height: 80, borderRadius: 27, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.alpha(COLORS.primary, '04'), marginBottom: 20 }, permissionTitle: { fontSize: 19, lineHeight: 27, textAlign: 'center', fontWeight: '700', color: COLORS.onSurface }, permissionText: { fontSize: 12, lineHeight: 20, color: COLORS.onSurfaceVariant, textAlign: 'center', marginTop: 9, marginBottom: 20 },
  primary: { minHeight: 50, borderRadius: 15, paddingHorizontal: 20, paddingVertical: 12, backgroundColor: COLORS.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }, primaryText: { fontSize: 13, fontWeight: '700', color: COLORS.onPrimary },
  tip: { flexDirection: 'row', alignItems: 'flex-start', gap: 9, padding: 14, borderRadius: 16, backgroundColor: COLORS.alpha(COLORS.primary, '04') }, tipText: { flex: 1, fontSize: 11, lineHeight: 18, color: COLORS.onSurfaceVariant },
  previewPanel: { gap: 14 }, previewHeader: { flexDirection: 'row', alignItems: 'center', gap: 7 }, previewTitle: { fontSize: 12, fontWeight: '600', color: COLORS.primary }, previewImage: { width: '100%', height: 250, borderRadius: 22, backgroundColor: COLORS.surfaceContainer },
  error: { borderRadius: 16, backgroundColor: COLORS.alpha(COLORS.error, '18'), padding: 14, flexDirection: 'row', alignItems: 'flex-start', gap: 9 }, errorText: { flex: 1, fontSize: 12, lineHeight: 19, color: COLORS.onSurface },
  secondary: { minHeight: 44, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 7, paddingHorizontal: 10 }, secondaryText: { fontSize: 12, fontWeight: '600', color: COLORS.onSurfaceVariant },
});
