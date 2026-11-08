import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../../constants/colors';
import { ScanBatch, ScanDraftItem, StorageGuide } from '../types/scan';
import { ExistingScanFood } from '../services/scanBatchApi';
import ScanDateField from './ScanDateField';
import { CropThumbnail } from './ScanCropEditor';
import { draftReadiness } from '../utils/scanReview';
import ScanStorageGuidance from './ScanStorageGuidance';

export const STORAGE_CHOICES = [
  { value: 'REFRIGERATOR', label: 'Tủ mát' }, { value: 'FREEZER', label: 'Ngăn đông' }, { value: 'OUTSIDE', label: 'Bên ngoài' }, { value: 'PANTRY', label: 'Tủ khô' }, { value: 'KITCHEN_CABINET', label: 'Tủ bếp' },
];
export function ChoiceGroup({ label, value, options, onChange }: { label: string; value: string; options: { value: string; label: string }[]; onChange: (value: string) => void }) {
  return <View style={styles.field}><Text style={styles.label}>{label}</Text><View style={styles.choices}>{options.map((option) => <Pressable key={option.value} accessibilityRole="radio" accessibilityState={{ checked: value === option.value }} onPress={() => onChange(option.value)} style={[styles.choice, option.value === value && styles.choiceActive]}><Text style={[styles.choiceText, option.value === value && { color: COLORS.primary }]}>{option.label}</Text></Pressable>)}</View></View>;
}
function Input({ label, value, onChange, numeric = false }: { label: string; value: string; onChange: (value: string) => void; numeric?: boolean }) {
  return <View style={styles.field}><Text style={styles.label}>{label}</Text><TextInput accessibilityLabel={label} style={styles.input} value={value} onChangeText={onChange} keyboardType={numeric ? 'decimal-pad' : 'default'} placeholderTextColor={COLORS.onSurfaceVariant} maxLength={numeric ? 12 : 160} /></View>;
}

export default function ScanReviewItem({ item, source, purchaseDate, categoryName, expanded, duplicates, saving, onPatch, onExpand, onCrop, onCategory, onRescan, onSplit, onRemove, onGuide }: {
  item: ScanDraftItem; source: ScanBatch; purchaseDate: string; categoryName: string; expanded: boolean; duplicates: ExistingScanFood[]; saving: boolean;
  onPatch: (patch: Partial<ScanDraftItem>) => void; onExpand: () => void; onCrop: () => void; onCategory: () => void; onRescan: () => void; onSplit: () => void; onRemove: () => void; onGuide: (guide: StorageGuide) => void;
}) {
  const readiness = draftReadiness(item, purchaseDate);
  return <View style={[styles.card, item.selected && styles.selectedCard, item.saved && { opacity: 0.72 }]}>
    <View style={styles.summary}>
      <Pressable disabled={saving || item.saved || item.saveUncertain} accessibilityRole="checkbox" accessibilityLabel={`${item.saved ? 'Đã lưu' : 'Chọn'} ${item.foodName || 'món bổ sung'}`} accessibilityState={{ checked: item.saved || item.selected, disabled: saving || item.saved || item.saveUncertain }} onPress={() => onPatch({ selected: !item.selected })} style={styles.checkTarget}><Ionicons name={item.saved ? 'checkmark-done-circle' : item.selected ? 'checkbox' : 'square-outline'} size={27} color={item.saved || item.selected ? COLORS.primary : COLORS.onSurfaceVariant} /></Pressable>
      <Pressable disabled={saving || item.saved || item.saveUncertain} onPress={onCrop} accessibilityRole="button" accessibilityLabel={`Chọn ảnh riêng cho ${item.foodName || 'món này'}`}><CropThumbnail source={source} box={item.imageMode === 'CROP' ? item.boundingBox : undefined} size={72} /></Pressable>
      <Pressable disabled={saving || item.saved || item.saveUncertain} accessibilityRole="button" accessibilityState={{ expanded }} onPress={onExpand} style={{ flex: 1, gap: 5 }}>
        <Text style={styles.name}>{item.foodName || 'Món chưa có trong kết quả'}</Text><Text style={styles.meta}>{item.quantity} {item.unit} · {categoryName || 'Chọn danh mục'}</Text>
        <Text style={styles.meta}>{item.containerLabel || STORAGE_CHOICES.find((choice) => choice.value === item.storageType)?.label}</Text>
        <View style={styles.tag}><Ionicons name={readiness.ready ? 'checkmark-circle-outline' : 'information-circle-outline'} size={14} color={readiness.ready ? COLORS.primary : COLORS.onSurfaceVariant} /><Text style={[styles.tagText, readiness.ready && { color: COLORS.primary }]}>{readiness.label}</Text></View>
        {!!readiness.detail && <Text style={styles.meta}>{readiness.detail}</Text>}
        {!item.saved && !item.saveUncertain && <Text style={styles.splitText}>{expanded ? 'Thu gọn ⌃' : 'Sửa / xem chi tiết ⌄'}</Text>}
      </Pressable>
    </View>
    {!item.saved && item.error && <Text accessibilityLiveRegion="polite" style={styles.error}>{item.error}</Text>}
    {!item.saved && !item.identityConfirmed && <View style={styles.notice}><Ionicons name="eye-off-outline" size={17} color={COLORS.secondary} /><Text style={styles.noticeText}>{item.visibility === 'PACKAGED' || item.visibility === 'OCCLUDED' ? 'Bao/gói hoặc vật khác đang che món. Kiểm tra nhãn, sửa tên hoặc quét lại; AI không thấy được bên trong bao kín.' : 'AI chưa chắc tên món. Hãy kiểm tra, sửa tên/danh mục nếu cần.'}</Text></View>}
    {!item.saved && duplicates.length > 0 && <View style={styles.duplicate}>
      <Text style={styles.duplicateTitle}>Kho đã có món tương tự</Text>
      {duplicates.slice(0, 3).map((food) => <Text key={food._id} style={styles.noticeText}>{food.foodName} · {food.quantity} {food.unit}{food.containerLabel ? ` · ${food.containerLabel}` : ''}</Text>)}
      <Pressable disabled={saving} accessibilityRole="checkbox" accessibilityState={{ checked: item.duplicateDecision === 'NEW_LOT' }} onPress={() => onPatch({ duplicateDecision: item.duplicateDecision === 'NEW_LOT' ? 'REVIEW' : 'NEW_LOT' })} style={styles.confirm}><Ionicons name={item.duplicateDecision === 'NEW_LOT' ? 'checkbox' : 'square-outline'} size={22} color={COLORS.primary} /><Text style={styles.confirmText}>Đây là lô mua mới, không phải ảnh của món đã lưu</Text></Pressable>
    </View>}
    {!item.saved && !item.saveUncertain && expanded && <View style={styles.editor} pointerEvents={saving ? 'none' : 'auto'}>
      <Input label="Tên thực phẩm" value={item.foodName} onChange={(foodName) => onPatch({ foodName })} />
      <Pressable accessibilityRole="button" onPress={onCategory} style={styles.category}><Text style={styles.label}>Danh mục</Text><View style={styles.categoryRow}><Text style={styles.categoryText}>{categoryName || 'Chọn danh mục phù hợp'}</Text><Ionicons name="chevron-down" size={17} color={COLORS.primary} /></View></Pressable>
      <View style={styles.row}><Input label="Số lượng" value={item.quantity} onChange={(quantity) => onPatch({ quantity })} numeric /><View style={{ flex: 1 }}><ChoiceGroup label="Đơn vị" value={item.unit} options={['kg', 'g', 'ml', 'l', 'quả', 'cái'].map((unit) => ({ value: unit, label: unit }))} onChange={(unit) => onPatch({ unit })} /></View></View>
      <ChoiceGroup label="Trạng thái thực tế" value={item.foodState} options={[{ value: 'RAW', label: 'Sống / tươi' }, { value: 'COOKED', label: 'Đã nấu' }, { value: 'UNKNOWN', label: 'Chưa rõ' }]} onChange={(foodState) => onPatch({ foodState: foodState as ScanDraftItem['foodState'] })} />
      <ChoiceGroup label="Nơi sẽ bảo quản" value={item.storageType} options={STORAGE_CHOICES} onChange={(storageType) => onPatch({ storageType })} />
      <ChoiceGroup label="Bao gói / chia phần" value={item.packaging} options={[{ value: 'SEALED', label: 'Gói còn kín' }, { value: 'OPENED', label: 'Đã mở' }, { value: 'PORTIONED', label: 'Chia hộp' }, { value: 'UNKNOWN', label: 'Chưa rõ' }]} onChange={(packaging) => onPatch({ packaging: packaging as ScanDraftItem['packaging'] })} />
      <Input label="Nhãn hộp / mã phần (tuỳ chọn)" value={item.containerLabel} onChange={(containerLabel) => onPatch({ containerLabel: containerLabel.slice(0, 80) })} />
      <Pressable accessibilityRole="button" onPress={onSplit} style={styles.split}><Ionicons name="copy-outline" size={17} color={COLORS.primary} /><Text style={styles.splitText}>Chia số lượng thành 2 hộp / phần</Text></Pressable>
      <ScanStorageGuidance item={item} onPatch={onPatch} onApply={onGuide} />
      <ScanDateField label={item.storageType === 'FREEZER' ? 'Ngày bắt đầu cấp đông thực tế' : 'Ngày bắt đầu bảo quản / mở gói / cắt thực tế'} value={item.storageStartedAt} onChange={(storageStartedAt) => onPatch({ storageStartedAt })} />
      <ChoiceGroup label="Ngày này lấy từ đâu?" value={item.expiryBasis} options={[{ value: 'PACKAGE', label: 'Trên bao bì' }, { value: 'USER', label: 'Tự nhập' }, { value: 'REFERENCE', label: 'Mốc tham khảo' }]} onChange={(expiryBasis) => onPatch({ expiryBasis: expiryBasis as ScanDraftItem['expiryBasis'] })} />
      <ScanDateField label={item.expiryBasis === 'REFERENCE' ? 'Ngày nhắc kiểm tra (không phải hạn an toàn)' : item.expiryBasis === 'PACKAGE' ? 'Hạn dùng ghi trên bao bì' : 'Ngày bạn tự xác nhận'} value={item.expiryDate} onChange={(expiryDate) => onPatch({ expiryDate, expiryBasis: item.expiryBasis === 'REFERENCE' ? 'USER' : item.expiryBasis })} />
      <View style={styles.row}>
        <Pressable accessibilityRole="button" onPress={onCrop} style={styles.imageChoice}><Ionicons name="crop-outline" size={20} color={COLORS.primary} /><Text style={styles.splitText}>Chọn / sửa ảnh cắt</Text></Pressable>
        <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: item.imageMode === 'NONE' }} onPress={() => onPatch({ imageMode: item.imageMode === 'NONE' && item.boundingBox ? 'CROP' : 'NONE' })} style={styles.imageChoice}><Ionicons name={item.imageMode === 'NONE' ? 'checkbox' : 'square-outline'} size={20} color={COLORS.primary} /><Text style={styles.noticeText}>Không dùng ảnh riêng</Text></Pressable>
      </View>
      {!item.identityConfirmed && <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: item.identityConfirmed }} onPress={() => onPatch({ identityConfirmed: true })} style={styles.confirm}><Ionicons name="square-outline" size={24} color={COLORS.primary} /><Text style={styles.confirmText}>Tôi đã kiểm tra lại tên và danh mục của món này</Text></Pressable>}
      <View style={styles.row}><Pressable accessibilityRole="button" onPress={onRescan} style={styles.bottomAction}><Ionicons name="scan-outline" size={18} color={COLORS.primary} /><Text style={styles.splitText}>Quét lại món này</Text></Pressable><Pressable accessibilityRole="button" onPress={onRemove} style={styles.bottomAction}><Ionicons name="close-circle-outline" size={18} color={COLORS.error} /><Text style={styles.removeText}>Bỏ khỏi danh sách</Text></Pressable></View>
    </View>}
  </View>;
}

const styles = StyleSheet.create({
  card: { borderRadius: 22, padding: 14, borderWidth: 1, borderColor: COLORS.alpha(COLORS.outlineVariant, '50'), backgroundColor: COLORS.surfaceContainerLowest }, selectedCard: { borderColor: COLORS.primary }, summary: { flexDirection: 'row', alignItems: 'center', gap: 10 }, checkTarget: { minWidth: 32, minHeight: 48, alignItems: 'center', justifyContent: 'center' }, name: { fontSize: 15, lineHeight: 21, fontWeight: '700', color: COLORS.onSurface }, meta: { color: COLORS.onSurfaceVariant, fontSize: 10, lineHeight: 15 }, tag: { flexDirection: 'row', gap: 4, alignItems: 'center' }, tagText: { fontSize: 10, fontWeight: '600', color: COLORS.onSurfaceVariant },
  error: { fontSize: 12, lineHeight: 18, color: COLORS.error, marginTop: 12 }, notice: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', padding: 12, marginTop: 12, borderRadius: 12, backgroundColor: COLORS.alpha(COLORS.secondary, '18') }, noticeText: { flexShrink: 1, fontSize: 11, lineHeight: 18, color: COLORS.onSurfaceVariant }, duplicate: { padding: 12, gap: 7, borderRadius: 14, marginTop: 12, backgroundColor: COLORS.alpha(COLORS.secondary, '18') }, duplicateTitle: { fontSize: 12, fontWeight: '700', color: COLORS.onSurface },
  editor: { gap: 16, paddingTop: 18, marginTop: 16, borderTopWidth: 1, borderTopColor: COLORS.alpha(COLORS.outlineVariant, '30') }, field: { flex: 1, gap: 7 }, label: { fontSize: 11, color: COLORS.onSurfaceVariant, fontWeight: '600' }, input: { minHeight: 46, paddingHorizontal: 12, borderWidth: 1, borderColor: COLORS.alpha(COLORS.outlineVariant, '50'), borderRadius: 12, fontSize: 14, color: COLORS.onSurface, backgroundColor: COLORS.background }, row: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 }, choices: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 }, choice: { minHeight: 40, paddingHorizontal: 10, justifyContent: 'center', borderWidth: 1, borderColor: COLORS.alpha(COLORS.outlineVariant, '50'), borderRadius: 10 }, choiceActive: { borderColor: COLORS.primary, backgroundColor: COLORS.alpha(COLORS.primary, '04') }, choiceText: { fontSize: 11, fontWeight: '500', color: COLORS.onSurfaceVariant },
  category: { gap: 7 }, categoryRow: { minHeight: 46, borderWidth: 1, borderColor: COLORS.alpha(COLORS.outlineVariant, '50'), borderRadius: 12, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 8 }, categoryText: { flex: 1, fontSize: 13, color: COLORS.onSurface }, split: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, minHeight: 44, borderRadius: 12, backgroundColor: COLORS.alpha(COLORS.primary, '04') }, splitText: { color: COLORS.primary, fontSize: 11, fontWeight: '600', flexShrink: 1 },
  guide: { gap: 9, padding: 14, borderRadius: 16, backgroundColor: COLORS.alpha(COLORS.primary, '04') }, guideTitle: { fontSize: 12, fontWeight: '700', color: COLORS.onSurface }, guideRange: { fontSize: 14, fontWeight: '700', color: COLORS.primary }, guideButton: { flexDirection: 'row', alignItems: 'center', gap: 7, minHeight: 44 }, source: { minHeight: 36, justifyContent: 'center' }, sourceText: { fontSize: 11, color: COLORS.primary, textDecorationLine: 'underline' },
  imageChoice: { flex: 1, gap: 7, flexDirection: 'row', alignItems: 'center', minHeight: 48 }, confirm: { minHeight: 46, flexDirection: 'row', alignItems: 'center', gap: 9 }, confirmText: { flex: 1, color: COLORS.onSurface, fontSize: 11, lineHeight: 18 }, bottomAction: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 44 }, removeText: { color: COLORS.error, fontSize: 11, fontWeight: '600', flexShrink: 1 },
});
