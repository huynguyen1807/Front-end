import AsyncStorage from '@react-native-async-storage/async-storage';
import { ScanBatch, ScanReviewSession } from '../types/scan';
const writes = new Map<string, Promise<unknown>>();
export function writeScanDraft(key: string, review: ScanReviewSession | null) {
  const next = (writes.get(key) ?? Promise.resolve()).catch(() => {}).then(() => review ? AsyncStorage.setItem(key, encodeScanDraft(review)) : AsyncStorage.removeItem(key));
  writes.set(key, next);
  void next.finally(() => { if (writes.get(key) === next) writes.delete(key); }).catch(() => {});
  return next;
}
export async function readScanDraft(key: string) {
  await writes.get(key)?.catch(() => {});
  return AsyncStorage.getItem(key);
}

export function encodeScanDraft(review: ScanReviewSession) {
  // Photo data can be a web data URI. Store each source once rather than
  // repeating the same full photo in every recognized food result.
  return JSON.stringify({ version: 1, rootId: review.root.scanResultId,
    sources: Object.fromEntries(Object.entries(review.sources).map(([id, source]) => [id, { ...source, results: [] }])),
    items: review.items, purchaseDate: review.purchaseDate, sourceType: review.sourceType,
  });
}
export function decodeScanDraft(text: string): ScanReviewSession | null {
  try {
    const data = JSON.parse(text);
    if (data.version !== 1 || !data.sources || !Array.isArray(data.items) || data.items.length > 200 || typeof data.purchaseDate !== 'string') return null;
    const root = data.sources[data.rootId] as ScanBatch | undefined;
    if (!root?.imageUrl || !root.scanResultId || !root.inventoryContext || data.items.some((item: any) => !item?.clientItemId || !data.sources[item.sourceScanId]?.imageUrl || ['foodName', 'categoryId', 'quantity', 'unit', 'storageType', 'storageStartedAt', 'expiryDate'].some((key) => typeof item[key] !== 'string'))) return null;
    if (Object.values(data.sources).some((source: any) => !source || typeof source.imageUrl !== 'string' || !Number.isFinite(source.width) || source.width <= 0 || !Number.isFinite(source.height) || source.height <= 0)) return null;
    return { root, sources: data.sources, items: data.items, purchaseDate: data.purchaseDate, sourceType: data.sourceType === 'MARKET' ? 'MARKET' : 'SUPERMARKET' };
  } catch { return null; }
}
export async function scanDraftKey() {
  const text = await AsyncStorage.getItem('userInfo');
  if (!text) return null;
  const user = JSON.parse(text);
  const id = user._id ?? user.id;
  return typeof id === 'string' && id ? `freshfriends:scan-draft:v1:${id}` : null;
}
export { AsyncStorage as scanDraftStorage };
