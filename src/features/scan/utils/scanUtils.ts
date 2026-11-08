import { FoodRecognition, ScanResult } from '../types/scan';

export function validateImage(uri: string): { valid: boolean; error?: string } {
  if (!uri || !/^(file:|content:|blob:|data:image\/|https?:)/i.test(uri)) return { valid: false, error: 'Không đọc được ảnh này. Vui lòng chọn ảnh khác.' };
  return { valid: true };
}

export function recognitionToScanResult(food: FoodRecognition, imageUrl: string, id: string): ScanResult {
  const storage = food.storageSuggestion ?? { location: 'outside' as const, storageType: 'OUTSIDE', description: 'Vui lòng kiểm tra lại cách bảo quản.', temperature: '20–25°C', estimatedDays: 3 };
  const days = food.expiryEstimate?.predictedDays ?? storage.estimatedDays ?? 3;
  return {
    id, foodRecognition: food, imageUrl, storageSuggestion: storage,
    aiPredictedDays: days,
    expiryDate: food.expiryEstimate?.expiryDate ?? new Date(Date.now() + days * 86400000).toLocaleDateString('en-GB'),
    nutritionInfo: food.nutritionEstimate, mealSuggestions: [],
  };
}

export function expiryDisplayToIso(display: string): string {
  const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(display);
  if (!match) return '';
  const [, day, month, year] = match.map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return '';
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}
