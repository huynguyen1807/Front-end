import { Platform } from 'react-native';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { apiClient } from '../../../services/apiClient';
import { InventoryOwnerContext } from '../../inventory/types/inventory';
import { ScanBatch, ScanResult } from '../types/scan';

type ReceiptItem = {
  foodName: string;
  quantity: number;
  unit: string;
  confidence: number;
  categoryName?: string;
  categoryId?: string;
};

type ReceiptScanResponse = {
  scanResultId: string;
  capturedAt: string;
  purchaseDate?: string;
  inventoryContext: InventoryOwnerContext;
  warnings: string[];
  items: ReceiptItem[];
};

function getErrorMessage(error: any) {
  return error?.response?.data?.message || 'Chưa đọc được hóa đơn. Vui lòng kiểm tra mạng và thử lại.';
}

export async function scanReceiptImage(
  asset: { uri: string; width: number; height: number },
  inventoryContext: InventoryOwnerContext,
): Promise<ScanBatch & { purchaseDate?: string }> {
  const context = ImageManipulator.manipulate(asset.uri);
  let rendered: Awaited<ReturnType<typeof context.renderAsync>> | undefined;
  let prepared: { uri: string; width: number; height: number } | null = null;
  try {
    if (Math.max(asset.width, asset.height) > 2000) {
      context.resize(asset.width >= asset.height ? { width: 2000 } : { height: 2000 });
    }
    rendered = await context.renderAsync();
    prepared = await rendered.saveAsync({ format: SaveFormat.JPEG, compress: 0.8 });
  } finally {
    rendered?.release();
    context.release();
  }
  if (!prepared) throw new Error('Không chuẩn bị được ảnh hóa đơn. Vui lòng thử ảnh khác.');

  const form = new FormData();
  if (Platform.OS === 'web') {
    form.append('image', await (await fetch(prepared.uri)).blob(), 'receipt.jpg');
  } else {
    form.append('image', { uri: prepared.uri, type: 'image/jpeg', name: 'receipt.jpg' } as any);
  }

  try {
    const response = await apiClient.post<ReceiptScanResponse>('/api/ai/scan-receipt', form, {
      params: inventoryContext,
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60_000,
    });
    const receipt = response.data;
    const results: ScanResult[] = receipt.items.map((item, index) => ({
      id: `${receipt.scanResultId}-${index}`,
      foodRecognition: {
        productName: item.foodName,
        category: item.categoryName || 'Chưa phân loại',
        categoryName: item.categoryName,
        categoryId: item.categoryId,
        confidence: item.confidence,
        isFood: true,
        visibility: 'CLEAR',
        foodState: 'UNKNOWN',
        estimatedQuantity: { quantity: item.quantity, unit: item.unit },
        storageGuide: null,
      },
      aiPredictedDays: 0,
      expiryDate: '',
      storageSuggestion: {
        location: 'fridge',
        storageType: 'REFRIGERATOR',
        description: 'Chọn vị trí bảo quản phù hợp khi xác nhận món.',
        temperature: '',
      },
      mealSuggestions: [],
      imageUrl: asset.uri,
    }));

    return {
      jobId: `receipt-${receipt.scanResultId}`,
      scanResultId: receipt.scanResultId,
      capturedAt: receipt.capturedAt,
      width: prepared.width,
      height: prepared.height,
      results,
      imageUrl: prepared.uri,
      warnings: receipt.warnings || [],
      inventoryContext: receipt.inventoryContext,
      purchaseDate: receipt.purchaseDate,
    };
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}
