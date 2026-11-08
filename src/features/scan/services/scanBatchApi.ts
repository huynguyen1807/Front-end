import { Platform } from 'react-native';
import { apiClient } from '../../../services/apiClient';
import { FoodCategory, FoodItem } from '../../inventory/types/inventory';
import { ScanBatch, ScanDraftItem, ScanReviewSession, StorageAdvice, StorageGuide } from '../types/scan';

export type ExistingScanFood = { _id: string; foodName: string; categoryId: string; quantity: number; unit: string; containerLabel?: string; purchaseDate: string; scanResultId?: string; scanItemKey?: string; expiryDate?: string; expiryBasis?: ScanDraftItem['expiryBasis'] };
export type BatchSaveRow = { clientItemId: string; status: 'saved' | 'duplicate' | 'failed'; item?: FoodItem; alreadySaved?: boolean; message?: string; duplicates?: ExistingScanFood[]; uncertain?: boolean };
const message = (error: any) => error?.response?.data?.message || 'Chưa kết nối được máy chủ. Những món đã lưu sẽ không được thêm lại khi bạn thử tiếp.';
export async function loadReviewData(id: string): Promise<{ categories: FoodCategory[]; existing: ExistingScanFood[]; purchaseDate?: string }> {
  try { return (await apiClient.get(`/api/ai/scan-batches/${id}/review`, { timeout: 15000 })).data; } catch (error) { throw new Error(message(error)); }
}
export async function fetchStorageGuide(item: ScanDraftItem): Promise<StorageGuide | null> {
  return (await fetchStorageAdvice(item)).guide;
}
export async function fetchStorageAdvice(item: ScanDraftItem): Promise<StorageAdvice> {
  try { return (await apiClient.post('/api/ai/storage-guidance', { foodName: item.foodName, foodState: item.foodState, storageType: item.storageType, storageProfile: item.storageProfile, packaging: item.packaging }, { timeout: 10000 })).data; } catch (error) { throw new Error(message(error)); }
}
async function persistSource(source: ScanBatch) {
  const form = new FormData();
  if (Platform.OS === 'web') form.append('image', await (await fetch(source.imageUrl)).blob(), 'scan-source.jpg');
  else form.append('image', { uri: source.imageUrl, type: 'image/jpeg', name: 'scan-source.jpg' } as any);
  await apiClient.post(`/api/ai/scan-batches/${source.scanResultId}/image`, form, { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 60_000 });
}
export async function saveSelectedScanItems(review: ScanReviewSession, persisted: Set<string>, onStage: (label: string) => void): Promise<BatchSaveRow[]> {
  const selected = review.items.filter((item) => item.selected && !item.saved);
  const sourceIds = [...new Set([review.root.scanResultId, ...selected.map((item) => item.sourceScanId)])];
  try {
    for (let index = 0; index < sourceIds.length; index++) {
      const id = sourceIds[index];
      if (persisted.has(id)) continue;
      onStage(`Lưu ảnh tổng ${index + 1}/${sourceIds.length}…`);
      await persistSource(review.sources[id]); persisted.add(id);
    }
    const results: BatchSaveRow[] = [];
    // Small sequential batches expose actual saved counts and keep one slow
    // database write from making the whole review appear frozen.
    for (let start = 0; start < selected.length; start += 6) {
      onStage(`Đã xử lý ${start}/${selected.length} món · Đang lưu tiếp…`);
      try {
        const response = await apiClient.post(`/api/ai/scan-batches/${review.root.scanResultId}/items`, {
          purchaseDate: review.purchaseDate, sourceType: review.sourceType,
          items: selected.slice(start, start + 6).map((item) => ({ ...item, quantity: Number(item.quantity.replace(',', '.')) })),
        }, { timeout: 90_000 });
        results.push(...response.data.results);
      } catch (error) {
        const known = new Set(results.map((row) => row.clientItemId));
        const attempted = new Set(selected.slice(start, start + 6).map((item) => item.clientItemId));
        results.push(...selected.filter((item) => !known.has(item.clientItemId)).map((item): BatchSaveRow => ({ clientItemId: item.clientItemId, status: 'failed', uncertain: attempted.has(item.clientItemId), message: message(error) })));
        break;
      }
    }
    return results;
  } catch (error) { throw new Error(message(error)); }
}
