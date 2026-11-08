import { ScanBatch, ScanDraftItem, ScanReviewSession, StorageGuide } from '../types/scan';
let sequence = 0;
export const draftId = () => `draft-${Date.now().toString(36)}-${(++sequence).toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
export function localDate(value = new Date()) { return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`; }
export function addCalendarDays(value: string, days: number) {
  const date = new Date(`${value}T12:00:00Z`);
  if (!Number.isFinite(date.getTime())) return '';
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}
export function isCalendarDate(value: string) { return /^\d{4}-\d{2}-\d{2}$/.test(value) && addCalendarDays(value, 0) === value; }
export function guidanceDate(guide: StorageGuide, purchaseDate: string, storageStartedAt: string) {
  return addCalendarDays(guide.dateAnchor === 'PURCHASE' ? purchaseDate : storageStartedAt, guide.minDays);
}
export function changeReviewPurchaseDate(review: ScanReviewSession, purchaseDate: string): ScanReviewSession {
  return { ...review, purchaseDate, items: review.items.map((item) => {
    if (item.saved) return item;
    const storageStartedAt = item.storageStartedAt === review.purchaseDate ? purchaseDate : item.storageStartedAt;
    return { ...item, storageStartedAt, expiryDate: item.expiryBasis === 'REFERENCE' && item.guide ? guidanceDate(item.guide, purchaseDate, storageStartedAt) : item.expiryDate };
  }) };
}
export const matchFoodKey = (name: string, categoryId: string) => `${name.trim().normalize('NFC').toLocaleLowerCase('vi').replace(/\s+/g, ' ')}|${categoryId}`;

export function draftsFromBatch(batch: ScanBatch, purchaseDate: string): ScanDraftItem[] {
  return batch.results.map((result, index) => {
    const food = result.foodRecognition, guide = food.storageGuide;
    const certain = food.visibility === 'CLEAR' && food.confidence >= 0.75;
    return {
      clientItemId: `${batch.scanResultId}-${index}`, sourceScanId: batch.scanResultId,
      foodName: food.productName, categoryId: food.categoryId ?? '', quantity: String(food.estimatedQuantity?.quantity ?? 1), unit: food.estimatedQuantity?.unit ?? 'kg',
      storageType: result.storageSuggestion.storageType ?? 'REFRIGERATOR', foodState: food.foodState ?? 'UNKNOWN',
      packaging: 'UNKNOWN', containerLabel: '', storageStartedAt: purchaseDate,
      expiryDate: guide ? addCalendarDays(purchaseDate, guide.minDays) : '', expiryBasis: guide ? 'REFERENCE' : 'USER', guide,
      boundingBox: food.boundingBox, imageMode: food.boundingBox ? 'CROP' : 'NONE',
      selected: Boolean(certain && food.categoryId && guide && food.boundingBox), saved: false, identityConfirmed: certain,
      confidence: food.confidence, visibility: food.visibility, manual: false, duplicateDecision: 'REVIEW',
    };
  });
}
export function createReview(batch: ScanBatch): ScanReviewSession {
  const purchaseDate = localDate();
  return { root: batch, sources: { [batch.scanResultId]: batch }, items: draftsFromBatch(batch, purchaseDate), purchaseDate, sourceType: 'SUPERMARKET' };
}
export function appendScan(review: ScanReviewSession, batch: ScanBatch, replaceId?: string): ScanReviewSession {
  const remaining = batch.results.length && replaceId ? review.items.filter((item) => item.clientItemId !== replaceId || item.saved || item.saveUncertain) : review.items;
  const keys = new Set(remaining.map((item) => matchFoodKey(item.foodName, item.categoryId)));
  const added = draftsFromBatch(batch, review.purchaseDate).map((item) => keys.has(matchFoodKey(item.foodName, item.categoryId)) ? { ...item, selected: false, error: 'Danh sách đã có món tương tự. Kiểm tra đây là phần mới hay ảnh trùng.' } : item);
  return { ...review, sources: { ...review.sources, [batch.scanResultId]: batch }, items: [...remaining, ...added] };
}
export function manualDraft(review: ScanReviewSession): ScanDraftItem {
  return { clientItemId: draftId(), sourceScanId: review.root.scanResultId, foodName: '', categoryId: '', quantity: '1', unit: 'kg', storageType: 'REFRIGERATOR', foodState: 'UNKNOWN', packaging: 'UNKNOWN', containerLabel: '', storageStartedAt: review.purchaseDate, expiryDate: '', expiryBasis: 'USER', imageMode: 'NONE', selected: false, saved: false, identityConfirmed: true, manual: true, duplicateDecision: 'REVIEW' };
}
export function validateDraft(item: ScanDraftItem, purchaseDate: string): string | null {
  if (item.saveUncertain) return 'Cần đối chiếu kết quả lưu trước khi sửa hoặc lưu tiếp món này.';
  if (!item.foodName.trim() || !item.categoryId) return 'Bổ sung tên và danh mục.';
  const quantity = Number(item.quantity.replace(',', '.'));
  if (!Number.isFinite(quantity) || quantity <= 0 || quantity > 100_000) return 'Số lượng phải lớn hơn 0 và không vượt quá 100.000.';
  if (!item.identityConfirmed) return 'Xác nhận lại món bị che khuất hoặc chưa chắc tên.';
  if (!isCalendarDate(item.storageStartedAt) || item.storageStartedAt < purchaseDate || item.storageStartedAt > localDate()) return 'Kiểm tra ngày bắt đầu bảo quản.';
  if (!isCalendarDate(item.expiryDate) || item.expiryDate < item.storageStartedAt) return 'Chọn ngày theo bao bì, tự nhập hoặc áp dụng gợi ý phù hợp.';
  if (item.imageMode === 'CROP' && !item.boundingBox) return 'Chọn vùng ảnh đúng món hoặc bỏ ảnh riêng.';
  if (item.expiryBasis === 'REFERENCE' && !item.guide) return 'Áp dụng lại gợi ý theo trạng thái và nơi bảo quản.';
  return null;
}
export function draftReadiness(item: ScanDraftItem, purchaseDate: string) {
  if (item.saved) return { label: 'Đã lưu', detail: '', ready: true };
  if (item.saveUncertain) return { label: 'Cần đối chiếu kho', detail: 'Chưa xác nhận được kết quả lần lưu trước.', ready: false };
  if (!item.foodName.trim()) return { label: 'Thiếu tên món', detail: 'Nhập tên thực phẩm hoặc quét lại.', ready: false };
  if (!item.categoryId) return { label: 'Chọn danh mục', detail: 'Cần danh mục để lưu đúng nhóm thực phẩm.', ready: false };
  if (!item.identityConfirmed) return { label: 'Xác nhận tên món', detail: 'Ảnh chưa rõ hoặc AI chưa chắc tên.', ready: false };
  if (!item.expiryDate) return { label: 'Chọn ngày nhắc', detail: 'Xem gợi ý bảo quản hoặc nhập ngày theo bao bì.', ready: false };
  const error = validateDraft(item, purchaseDate);
  return error ? { label: 'Kiểm tra thông tin', detail: error, ready: false } : { label: 'Đủ thông tin', detail: '', ready: true };
}
export function splitDraft(item: ScanDraftItem): ScanDraftItem[] {
  if (item.saved || item.saveUncertain) return [];
  const total = Number(item.quantity.replace(',', '.'));
  if (!Number.isFinite(total) || total <= 0) return [];
  const discrete = ['quả', 'cái'].includes(item.unit);
  if (discrete && (!Number.isInteger(total) || total < 2)) return [];
  const first = discrete ? Math.floor(total / 2) : Math.floor(total * 5000) / 10000;
  if (first <= 0) return [];
  return [first, Number((total - first).toFixed(4))].map((quantity, index) => ({ ...item, clientItemId: draftId(), quantity: String(quantity), packaging: 'PORTIONED', containerLabel: `${item.containerLabel || item.foodName || 'Thực phẩm'} · hộp ${index + 1}`.slice(0, 80), saved: false, error: undefined }));
}
