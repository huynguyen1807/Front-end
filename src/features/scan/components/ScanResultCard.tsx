import { Dispatch, SetStateAction, forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { ActivityIndicator, Image, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../../constants/colors';
import { FoodCategory } from '../../inventory/types/inventory';
import { ScanDraftItem, ScanReviewSession, StorageGuide } from '../types/scan';
import { ExistingScanFood, loadReviewData, saveSelectedScanItems } from '../services/scanBatchApi';
import { changeReviewPurchaseDate, guidanceDate, isCalendarDate, localDate, manualDraft, matchFoodKey, splitDraft, validateDraft } from '../utils/scanReview';
import ScanCropEditor from './ScanCropEditor';
import ScanReviewItem, { ChoiceGroup, STORAGE_CHOICES } from './ScanReviewItem';
import ScanDateField from './ScanDateField';

export type ScanReviewHandle = { save: () => Promise<void> };
type Props = { review: ScanReviewSession; onChange: Dispatch<SetStateAction<ScanReviewSession | null>>; onRescan: (replaceId?: string) => void; onNewBatch: () => void; onSaved: () => void; persistedSources: Set<string>; onSaveState: Dispatch<SetStateAction<{ saving: boolean; stage: string }>> };
const ScanResultCard = forwardRef<ScanReviewHandle, Props>(function ScanResultCard({ review, onChange, onRescan, onNewBatch, onSaved, persistedSources, onSaveState }, ref) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [categories, setCategories] = useState<FoodCategory[]>([]);
  const [existing, setExisting] = useState<ExistingScanFood[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [loadingData, setLoadingData] = useState(false);
  const [dataError, setDataError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveStage, setSaveStage] = useState('');
  useEffect(() => { onSaveState({ saving, stage: saveStage }); }, [saving, saveStage, onSaveState]);
  const [categoryFor, setCategoryFor] = useState<string | null>(null);
  const [categorySearch, setCategorySearch] = useState('');
  const [cropFor, setCropFor] = useState<string | null>(null);
  const [tipsOpen, setTipsOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkDate, setBulkDate] = useState('');
  const [bulkBasis, setBulkBasis] = useState<'PACKAGE' | 'USER'>('USER');
  const [bulkStorage, setBulkStorage] = useState('');
  const saveLock = useRef(false), mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const rootId = review.root.scanResultId;
  const refreshData = async () => {
    setLoadingData(true); setDataError(false);
    try {
      const data = await loadReviewData(rootId);
      if (!mounted.current) return;
      setCategories(data.categories); setExisting(data.existing);
      onChange((current) => current && current.root.scanResultId === rootId ? { ...current, purchaseDate: data.purchaseDate ?? current.purchaseDate, items: current.items.map((item) => {
        const saved = data.existing.find((food) => food.scanResultId === rootId && food.scanItemKey === item.clientItemId);
        if (saved) return { ...item, saved: true, selected: false, saveUncertain: false, foodName: saved.foodName, categoryId: String(saved.categoryId), quantity: String(saved.quantity), unit: saved.unit, containerLabel: saved.containerLabel ?? item.containerLabel, expiryDate: saved.expiryDate?.slice(0, 10) ?? item.expiryDate, expiryBasis: saved.expiryBasis ?? item.expiryBasis, error: undefined };
        const cleared = item.saveUncertain ? { ...item, saveUncertain: false, error: 'Chưa ghi nhận món này trong kho. Có thể kiểm tra rồi chọn lưu lại.' } : item;
        return data.existing.some((food) => matchFoodKey(food.foodName, String(food.categoryId)) === matchFoodKey(item.foodName, item.categoryId)) && item.duplicateDecision !== 'NEW_LOT' && !item.saved ? { ...cleared, selected: false } : cleared;
      }) } : current);
    } catch (error) { if (mounted.current) { setDataError(true); setMessage(error instanceof Error ? error.message : 'Chưa đối chiếu được kho. Máy chủ sẽ kiểm tra lại khi lưu.'); } }
    finally { if (mounted.current) setLoadingData(false); }
  };
  useEffect(() => { void refreshData(); }, [rootId]);
  const patch = (id: string, changes: Partial<ScanDraftItem>) => onChange((current) => {
    if (!current) return current;
    return { ...current, items: current.items.map((item) => {
      if (item.clientItemId !== id || item.saved || item.saveUncertain) return item;
      const next = { ...item, ...changes, error: changes.error };
      if (item.expiryBasis === 'PACKAGE' && item.expiryDate) next.packageExpiryDate = item.expiryDate;
      if (changes.expiryDate && next.expiryBasis === 'PACKAGE') next.packageExpiryDate = changes.expiryDate;
      if (['foodName', 'categoryId', 'foodState', 'storageType', 'storageProfile', 'packaging'].some((key) => key in changes && (changes as any)[key] !== (item as any)[key])) {
        next.guide = null;
        if ('foodName' in changes && changes.foodName !== item.foodName) next.storageProfile = undefined;
        if (next.expiryBasis === 'REFERENCE') { next.expiryDate = ''; next.expiryBasis = 'USER'; }
        if ('foodName' in changes || 'categoryId' in changes) next.duplicateDecision = 'REVIEW';
      }
      if (changes.expiryBasis && changes.expiryBasis !== item.expiryBasis && changes.expiryDate === undefined) next.expiryDate = changes.expiryBasis === 'PACKAGE' ? next.packageExpiryDate ?? '' : changes.expiryBasis === 'REFERENCE' && next.guide ? guidanceDate(next.guide, current.purchaseDate, next.storageStartedAt) : '';
      if (changes.storageStartedAt && next.expiryBasis === 'REFERENCE' && next.guide) next.expiryDate = guidanceDate(next.guide, current.purchaseDate, changes.storageStartedAt);
      return next;
    }) };
  });
  const duplicatesFor = (item: ScanDraftItem) => existing.filter((food) => matchFoodKey(food.foodName, String(food.categoryId)) === matchFoodKey(item.foodName, item.categoryId)
    && !(food.scanResultId === rootId && item.containerLabel && food.containerLabel && item.containerLabel !== food.containerLabel));
  const applyGuide = (item: ScanDraftItem, guide: StorageGuide) => {
    if (item.expiryBasis === 'PACKAGE' && item.expiryDate) {
      patch(item.clientItemId, { guide, packageExpiryDate: item.expiryDate });
      setMessage('Đã xem hướng dẫn. Giữ nguyên hạn trên bao bì bạn đã nhập.'); return;
    }
    const expiryDate = guidanceDate(guide, review.purchaseDate, item.storageStartedAt);
    if (item.packageExpiryDate && expiryDate > item.packageExpiryDate) {
      patch(item.clientItemId, { guide, expiryBasis: 'PACKAGE', expiryDate: item.packageExpiryDate });
      setMessage('Hạn trên bao bì sớm hơn mốc tham khảo nên được giữ lại.'); return;
    }
    patch(item.clientItemId, { guide, expiryBasis: 'REFERENCE', expiryDate });
  };
  const addManual = () => {
    const item = manualDraft(review); onChange((current) => current ? { ...current, items: [...current.items, item] } : current); setExpanded(item.clientItemId);
  };
  const split = (item: ScanDraftItem) => {
    const portions = splitDraft(item);
    if (!portions.length) { setMessage('Số lượng chưa đủ hoặc chưa hợp lệ để chia 2 phần. Với quả/cái, cần ít nhất 2 và số lượng nguyên.'); return; }
    onChange((current) => current ? { ...current, items: current.items.flatMap((row) => row.clientItemId === item.clientItemId ? portions : [row]) } : current);
    setExpanded(portions[0].clientItemId); setMessage('Đã chia số lượng thành 2 phần, tổng số lượng giữ nguyên. Sửa nhãn hộp để phân biệt.');
  };
  const save = async () => {
    if (saveLock.current) return;
    const selected = review.items.filter((item) => item.selected && !item.saved);
    if (!selected.length) return;
    if (!isCalendarDate(review.purchaseDate) || review.purchaseDate > localDate()) { setMessage('Kiểm tra ngày mua, không chọn ngày tương lai.'); return; }
    const invalid = new Map<string, string>();
    for (const item of selected) {
      const error = validateDraft(item, review.purchaseDate);
      if (error) invalid.set(item.clientItemId, error);
      else if (duplicatesFor(item).length && item.duplicateDecision !== 'NEW_LOT') invalid.set(item.clientItemId, 'Kho đã có món tương tự. Xác nhận lô mới hoặc bỏ chọn.');
    }
    if (invalid.size) { onChange((current) => current ? { ...current, items: current.items.map((item) => invalid.has(item.clientItemId) ? { ...item, error: invalid.get(item.clientItemId) } : item) } : current); setExpanded(invalid.keys().next().value!); setMessage('Bổ sung thông tin cho những món đã chọn, hoặc bỏ tick để lưu các món còn lại.'); return; }
    saveLock.current = true; setSaving(true); setMessage(null);
    try {
      const results = await saveSelectedScanItems(review, persistedSources, (label) => { if (mounted.current) setSaveStage(label); });
      if (!mounted.current) return;
      const byId = new Map(results.map((row) => [row.clientItemId, row]));
      onChange((current) => current ? { ...current, items: current.items.map((item) => {
        const result = byId.get(item.clientItemId);
        return !result ? item : result.status === 'saved' ? { ...item, saved: true, selected: false, saveUncertain: false, error: undefined, foodName: result.item?.foodName ?? item.foodName, categoryId: result.item?.categoryId?._id ?? item.categoryId, quantity: String(result.item?.quantity ?? item.quantity), unit: result.item?.unit ?? item.unit, expiryDate: result.item?.expiryDate?.slice(0, 10) ?? item.expiryDate, expiryBasis: result.item?.expiryBasis ?? item.expiryBasis, containerLabel: result.item?.containerLabel ?? item.containerLabel } : { ...item, selected: false, saveUncertain: Boolean(result.uncertain), error: result.message || 'Cần kiểm tra lại món này.' };
      }) } : current);
      const saved = results.filter((row) => row.status === 'saved');
      setExisting((current) => {
        const next = [...current];
        for (const row of saved) if (row.item && !next.some((food) => food._id === row.item!._id)) next.push({ _id: row.item._id, foodName: row.item.foodName, categoryId: row.item.categoryId?._id, quantity: row.item.quantity, unit: row.item.unit, purchaseDate: row.item.purchaseDate, containerLabel: (row.item as any).containerLabel, scanResultId: rootId });
        for (const row of results) for (const duplicate of row.duplicates ?? []) if (!next.some((food) => food._id === duplicate._id)) next.push({ ...duplicate, categoryId: review.items.find((item) => item.clientItemId === row.clientItemId)?.categoryId ?? '' });
        return next;
      });
      setMessage(`Đã lưu ${saved.length}/${selected.length} món được chọn.${saved.length < selected.length ? ' Các món chưa lưu vẫn ở đây để sửa hoặc quét lại.' : ' Ảnh tổng đã được giữ theo lô mua.'}`);
      if (saved.length) onSaved();
    } catch (error) { if (mounted.current) setMessage(error instanceof Error ? error.message : 'Chưa nhận được kết quả lưu. Có thể thử lại mà không thêm lặp những món đã ghi nhận.'); }
    finally { saveLock.current = false; if (mounted.current) { setSaving(false); setSaveStage(''); } }
  };
  const selectedCount = review.items.filter((item) => item.selected && !item.saved).length;
  useImperativeHandle(ref, () => ({ save }));
  const savedCount = review.items.filter((item) => item.saved).length;
  const cropItem = review.items.find((item) => item.clientItemId === cropFor);
  const chooseReady = () => onChange((current) => current ? { ...current, items: current.items.map((item) => ({ ...item, selected: !item.saved && !validateDraft(item, current.purchaseDate) && (!duplicatesFor(item).length || item.duplicateDecision === 'NEW_LOT') })) } : current);
  return <View style={styles.container}>
    <View style={styles.photoFrame}><Image source={{ uri: review.root.imageUrl }} style={styles.photo} resizeMode="contain" /><View style={styles.photoBadge}><Ionicons name="images-outline" size={15} color="white" /><Text style={styles.photoBadgeText}>Ảnh tổng của lô · giữ cùng ảnh riêng từng món</Text></View></View>
    <View><Text style={styles.title}>Kiểm tra một lần,{`\n`}thêm nhiều món</Text><Text style={styles.subtitle}>Tick món đúng để lưu cùng lúc. Bỏ tick món chưa rõ, sửa tên hoặc quét bổ sung mà không mất danh sách.</Text><Text style={styles.captureDate}>Ảnh ghi nhận: {new Date(review.root.capturedAt).toLocaleDateString('vi-VN')} · Ngày mua do bạn xác nhận bên dưới</Text></View>
    <View style={styles.batchSettings}><ScanDateField label={savedCount ? 'Ngày mua của lô (đã lưu)' : 'Ngày mua của lô'} value={review.purchaseDate} disabled={saving || savedCount > 0} onChange={(purchaseDate) => onChange((current) => current ? changeReviewPurchaseDate(current, purchaseDate) : current)} /><ChoiceGroup label="Nơi mua" value={review.sourceType} options={[{ value: 'SUPERMARKET', label: 'Siêu thị' }, { value: 'MARKET', label: 'Chợ' }]} onChange={(value) => !saving && onChange((current) => current ? { ...current, sourceType: value as ScanReviewSession['sourceType'] } : current)} /></View>
    <View style={styles.notice}><Ionicons name="information-circle-outline" size={20} color={COLORS.primary} /><Text style={styles.noticeText}>Ảnh không xác định được độ tươi hay an toàn. Ngày trên bao bì, ngày tự nhập và mốc nhắc tham khảo được lưu riêng; đổi ngăn/ngày không làm món tươi lại.</Text></View>
    <Pressable accessibilityRole="button" accessibilityState={{ expanded: tipsOpen }} onPress={() => setTipsOpen(!tipsOpen)} style={styles.tipsHeader}><Ionicons name="file-tray-stacked-outline" size={19} color={COLORS.primary} /><Text style={styles.tipsTitle}>Chụp rõ, chia hộp và tránh thêm trùng</Text><Ionicons name={tipsOpen ? 'chevron-up' : 'chevron-down'} size={16} color={COLORS.primary} /></Pressable>
    {tipsOpen && <View style={styles.tips}><Text style={styles.noticeText}>• Túi che kín: xếp các gói riêng, quay nhãn ra camera; không cần mở bao kín của nhà sản xuất chỉ để quét. Không nhìn rõ thì nhập tay hoặc chụp bổ sung.</Text><Text style={styles.noticeText}>• Dùng hộp/túi phù hợp thực phẩm, giữ kín; tách thực phẩm sống khỏi món đã nấu. Ghi tên + ngày mua/cấp đông + mã hộp.</Text><Text style={styles.noticeText}>• “Chia 2 hộp” chia số lượng hiện có, không nhân đôi. Chỉ xác nhận “lô mua mới” khi khác món đã có trong kho.</Text></View>}
    {(message || dataError) && <View style={styles.message}><Text accessibilityLiveRegion="polite" style={styles.messageText}>{message}</Text>{dataError && <Pressable accessibilityRole="button" onPress={() => void refreshData()} style={styles.retry}><Text style={styles.link}>Đối chiếu kho lại</Text></Pressable>}</View>}
    {review.items.some((item) => item.saveUncertain) && <View style={styles.message}><Text style={styles.messageText}>Có món chưa nhận được phản hồi chắc chắn. Đối chiếu kho trước khi sửa/chia hộp để tránh thêm lặp.</Text><Pressable accessibilityRole="button" disabled={loadingData} onPress={() => void refreshData()} style={styles.retry}><Text style={styles.link}>{loadingData ? 'Đang đối chiếu…' : 'Đối chiếu kết quả lưu'}</Text></Pressable></View>}
    <View style={styles.selectionBar}><View style={{ flex: 1 }}><Text style={styles.selectionTitle}>{selectedCount} đã chọn · {savedCount} đã lưu</Text><Text style={styles.small}>Món chưa rõ không được tự chọn</Text></View>{loadingData ? <ActivityIndicator color={COLORS.primary} /> : <Pressable disabled={saving} accessibilityRole="button" onPress={chooseReady} style={styles.readyButton}><Text style={styles.link}>Chọn món đủ thông tin</Text></Pressable>}</View>
    <View style={styles.addRow}><Pressable disabled={saving} accessibilityRole="button" onPress={() => onChange((current) => current ? { ...current, items: current.items.map((item) => ({ ...item, selected: !item.saved && !item.saveUncertain })) } : current)} style={styles.retry}><Text style={styles.link}>Chọn tất cả</Text></Pressable><Pressable disabled={saving} accessibilityRole="button" onPress={() => onChange((current) => current ? { ...current, items: current.items.map((item) => ({ ...item, selected: false })) } : current)} style={styles.retry}><Text style={styles.link}>Bỏ chọn</Text></Pressable><Pressable disabled={saving} accessibilityRole="button" onPress={() => setBulkOpen(!bulkOpen)} style={[styles.retry, { flex: 1 }]}><Text style={styles.link}>Sửa chung các món đã tick {bulkOpen ? '⌃' : '⌄'}</Text></Pressable></View>
    {bulkOpen && <View style={styles.batchSettings}><Text style={styles.saveTitle}>Áp dụng nhanh cho {selectedCount} món đã chọn</Text><Text style={styles.noticeText}>Chỉ dùng ngày chung khi bạn đã kiểm tra và xác nhận phù hợp từng món. Không áp một hạn trên bao bì cho những món có nhãn khác nhau.</Text><ChoiceGroup label="Nơi bảo quản chung (tuỳ chọn)" value={bulkStorage} options={[{ value: '', label: 'Giữ riêng từng món' }, ...STORAGE_CHOICES]} onChange={setBulkStorage} /><ChoiceGroup label="Nguồn ngày chung" value={bulkBasis} options={[{ value: 'USER', label: 'Ngày tôi xác nhận' }, { value: 'PACKAGE', label: 'Cùng hạn trên bao bì' }]} onChange={(value) => setBulkBasis(value as 'USER' | 'PACKAGE')} /><ScanDateField label="Ngày áp dụng cho các món đã tick" value={bulkDate} onChange={setBulkDate} /><Pressable disabled={saving || !selectedCount} accessibilityRole="button" style={styles.secondaryButton} onPress={() => {
      if (!isCalendarDate(bulkDate)) { setMessage('Chọn ngày chung hợp lệ trước khi áp dụng.'); return; }
      onChange((current) => current ? { ...current, items: current.items.map((item) => item.selected && !item.saved ? { ...item, ...(bulkStorage ? { storageType: bulkStorage } : {}), expiryDate: bulkDate, expiryBasis: bulkBasis, guide: null, error: undefined } : item) } : current);
      setMessage('Đã cập nhật các món đang tick. Kiểm tra lại trước khi lưu.');
    }}><Text style={styles.link}>Áp dụng cho các món đã tick</Text></Pressable></View>}
    <View pointerEvents={saving ? 'none' : 'auto'} style={{ gap: 14 }}>{review.items.map((item) => <ScanReviewItem key={item.clientItemId} item={item} source={review.sources[item.sourceScanId]} purchaseDate={review.purchaseDate} categoryName={categories.find((category) => category._id === item.categoryId)?.displayName || categories.find((category) => category._id === item.categoryId)?.categoryName || ''} expanded={expanded === item.clientItemId} duplicates={duplicatesFor(item)} saving={saving} onPatch={(changes) => patch(item.clientItemId, changes)} onExpand={() => setExpanded(expanded === item.clientItemId ? null : item.clientItemId)} onCrop={() => setCropFor(item.clientItemId)} onCategory={() => { setCategorySearch(''); setCategoryFor(item.clientItemId); }} onRescan={() => onRescan(item.clientItemId)} onSplit={() => split(item)} onRemove={() => onChange((current) => current ? { ...current, items: current.items.filter((row) => row.clientItemId !== item.clientItemId) } : current)} onGuide={(guide) => applyGuide(item, guide)} />)}</View>
    <View style={styles.addRow}><Pressable disabled={saving} accessibilityRole="button" style={styles.secondaryButton} onPress={addManual}><Ionicons name="add-circle-outline" size={20} color={COLORS.primary} /><Text style={styles.link}>Thêm món bị bỏ sót</Text></Pressable><Pressable disabled={saving} accessibilityRole="button" style={styles.secondaryButton} onPress={() => onRescan()}><Ionicons name="scan-outline" size={20} color={COLORS.primary} /><Text style={styles.link}>Quét bổ sung</Text></Pressable></View>
    <View style={styles.savePanel}><Text style={styles.saveTitle}>{savedCount ? 'Lưu tiếp những món còn lại' : 'Sẵn sàng đưa vào tủ?'}</Text><Text style={styles.noticeText}>Chỉ lưu món đang tick. Ảnh riêng dùng đúng vùng đã chọn; ảnh tổng vẫn giữ theo lô.</Text><Pressable accessibilityRole="button" disabled={saving || !selectedCount} onPress={() => void save()} style={[styles.saveButton, (saving || !selectedCount) && { opacity: 0.5 }]}>{saving ? <ActivityIndicator color={COLORS.onPrimary} /> : <Ionicons name="checkmark-done" size={21} color={COLORS.onPrimary} />}<Text style={styles.saveButtonText}>{saving ? saveStage : `Thêm cùng lúc ${selectedCount} món vào tủ`}</Text></Pressable><Text style={styles.small}>Nếu một món gặp lỗi, những món đã lưu được đánh dấu riêng để không bị thêm lại.</Text></View>
    <Pressable disabled={saving} accessibilityRole="button" onPress={onNewBatch} style={styles.newBatch}><Text style={styles.small}>Hoàn tất / bắt đầu lô mua khác</Text><Ionicons name="arrow-forward" size={16} color={COLORS.onSurfaceVariant} /></Pressable>
    {cropItem && <ScanCropEditor source={review.sources[cropItem.sourceScanId]} initialBox={cropItem.boundingBox} onClose={() => setCropFor(null)} onConfirm={(boundingBox) => { patch(cropItem.clientItemId, { boundingBox, imageMode: 'CROP' }); setCropFor(null); }} />}
    {categoryFor && <Modal transparent visible animationType="fade" onRequestClose={() => setCategoryFor(null)}><View style={styles.modal}><Pressable accessibilityRole="button" accessibilityLabel="Đóng chọn danh mục" onPress={() => setCategoryFor(null)} style={styles.scrim} /><View style={styles.categoryPanel}><Text style={styles.saveTitle}>Chọn danh mục</Text><TextInput accessibilityLabel="Tìm danh mục" style={styles.search} value={categorySearch} onChangeText={setCategorySearch} placeholder="Tìm danh mục…" placeholderTextColor={COLORS.onSurfaceVariant} /><ScrollView style={{ maxHeight: 360 }}>{categories.filter((category) => `${category.categoryName} ${category.displayName}`.toLocaleLowerCase('vi').includes(categorySearch.toLocaleLowerCase('vi'))).map((category) => <Pressable accessibilityRole="button" key={category._id} onPress={() => { patch(categoryFor, { categoryId: category._id }); setCategoryFor(null); }} style={styles.categoryOption}><Text style={styles.categoryText}>{category.displayName || category.categoryName}</Text></Pressable>)}</ScrollView><Pressable accessibilityRole="button" onPress={() => setCategoryFor(null)} style={styles.retry}><Text style={styles.link}>Đóng</Text></Pressable></View></View></Modal>}
  </View>;
});
export default ScanResultCard;

const styles = StyleSheet.create({
  container: { gap: 16 }, photoFrame: { height: 180, borderRadius: 22, overflow: 'hidden', backgroundColor: COLORS.surfaceContainer }, photo: { width: '100%', height: '100%' }, photoBadge: { position: 'absolute', bottom: 10, left: 10, right: 10, backgroundColor: '#006a44', borderRadius: 12, padding: 9, flexDirection: 'row', alignItems: 'center', gap: 7 }, photoBadgeText: { color: 'white', fontSize: 10, fontWeight: '600', flex: 1 },
  title: { fontSize: 27, lineHeight: 34, letterSpacing: -0.6, fontWeight: '800', color: COLORS.onSurface }, subtitle: { color: COLORS.onSurfaceVariant, fontSize: 12, lineHeight: 20, marginTop: 9 }, captureDate: { color: COLORS.onSurfaceVariant, fontSize: 10, lineHeight: 16, marginTop: 7 }, batchSettings: { padding: 16, borderRadius: 20, gap: 16, backgroundColor: COLORS.surfaceContainerLowest, borderWidth: 1, borderColor: COLORS.alpha(COLORS.outlineVariant, '40') },
  notice: { padding: 14, backgroundColor: COLORS.alpha(COLORS.primary, '04'), flexDirection: 'row', gap: 9, borderRadius: 16 }, noticeText: { flexShrink: 1, fontSize: 11, lineHeight: 18, color: COLORS.onSurfaceVariant }, tipsHeader: { flexDirection: 'row', gap: 8, minHeight: 46, alignItems: 'center' }, tipsTitle: { flex: 1, fontSize: 12, fontWeight: '600', color: COLORS.primary }, tips: { marginTop: -10, gap: 9, padding: 14, borderRadius: 16, backgroundColor: COLORS.surfaceContainerLowest },
  message: { padding: 14, backgroundColor: COLORS.alpha(COLORS.secondary, '18'), borderRadius: 16 }, messageText: { fontSize: 12, lineHeight: 19, color: COLORS.onSurface }, retry: { minHeight: 44, alignItems: 'center', justifyContent: 'center' }, link: { color: COLORS.primary, fontSize: 11, fontWeight: '700', flexShrink: 1 },
  selectionBar: { flexDirection: 'row', gap: 12, alignItems: 'center' }, selectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.onSurface }, small: { fontSize: 10, lineHeight: 16, color: COLORS.onSurfaceVariant, marginTop: 3 }, readyButton: { paddingHorizontal: 4, minHeight: 44, justifyContent: 'center', maxWidth: '42%' }, addRow: { flexDirection: 'row', gap: 10 }, secondaryButton: { flex: 1, minHeight: 54, padding: 10, borderRadius: 14, borderWidth: 1, borderColor: COLORS.alpha(COLORS.outlineVariant, '50'), flexDirection: 'row', gap: 7, alignItems: 'center', justifyContent: 'center' },
  savePanel: { gap: 10, padding: 18, backgroundColor: COLORS.surfaceContainerLowest, borderRadius: 22, borderWidth: 1, borderColor: COLORS.alpha(COLORS.outlineVariant, '50') }, saveTitle: { fontSize: 17, fontWeight: '700', color: COLORS.onSurface }, saveButton: { minHeight: 54, padding: 14, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, backgroundColor: COLORS.primary }, saveButtonText: { color: COLORS.onPrimary, fontSize: 13, fontWeight: '700', flexShrink: 1 }, newBatch: { minHeight: 46, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  modal: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }, scrim: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(15,30,20,0.6)' }, categoryPanel: { width: '100%', maxWidth: 440, padding: 20, borderRadius: 24, backgroundColor: COLORS.surfaceContainerLowest, gap: 12 }, search: { minHeight: 46, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1, borderColor: COLORS.alpha(COLORS.outlineVariant, '50'), color: COLORS.onSurface }, categoryOption: { minHeight: 48, justifyContent: 'center', borderBottomWidth: 1, borderBottomColor: COLORS.alpha(COLORS.outlineVariant, '30') }, categoryText: { color: COLORS.onSurface, fontSize: 14 },
});
