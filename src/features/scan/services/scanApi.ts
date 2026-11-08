import { Platform } from 'react-native';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { apiClient } from '../../../services/apiClient';
import { InventoryOwnerContext } from '../../inventory/types/inventory';
import { FoodRecognition, ScanBatch, ScanPhoto, ScanProgress } from '../types/scan';
import { recognitionToScanResult } from '../utils/scanUtils';

type Job = {
  id: string; status: 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';
  stage: ScanProgress['stage']; progress: number;
  error?: { message: string; retryAfterSeconds?: number };
  result?: { foods: FoodRecognition[]; warnings: string[]; inventoryContext: InventoryOwnerContext; scanResultId: string; capturedAt: string };
};

function wait(ms: number, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const abort = () => { clearTimeout(timer); signal.removeEventListener('abort', abort); reject(new Error('Đã huỷ quét.')); };
    const timer = setTimeout(() => { signal.removeEventListener('abort', abort); resolve(); }, ms);
    signal.addEventListener('abort', abort, { once: true });
    if (signal.aborted) abort();
  });
}

async function preparePhoto(photo: ScanPhoto) {
  const context = ImageManipulator.manipulate(photo.uri);
  let image: Awaited<ReturnType<typeof context.renderAsync>> | undefined;
  try {
    if (Math.max(photo.width, photo.height) > 1600) {
      context.resize(photo.width >= photo.height ? { width: 1600 } : { height: 1600 });
    }
    image = await context.renderAsync();
    return await image.saveAsync({ format: SaveFormat.JPEG, compress: 0.7 });
  } finally {
    image?.release();
    context.release();
  }
}

export async function scanPhoto(
  photo: ScanPhoto,
  inventoryContext: InventoryOwnerContext,
  signal: AbortSignal,
  onProgress: (progress: ScanProgress) => void,
): Promise<ScanBatch> {
  let jobId: string | undefined;
  let completed = false;
  let uploadDone = false;
  const startedAt = Date.now();
  try {
    if (signal.aborted) throw new Error('Đã huỷ quét.');
    onProgress({ stage: 'preparing', percent: 2 });
    const prepared = await preparePhoto(photo);
    if (signal.aborted) throw new Error('Đã huỷ quét.');
    const form = new FormData();
    if (Platform.OS === 'web') {
      const blob = await (await fetch(prepared.uri, { signal })).blob();
      form.append('image', blob, 'food-scan.jpg');
    } else form.append('image', { uri: prepared.uri, type: 'image/jpeg', name: 'food-scan.jpg' } as any);
    onProgress({ stage: 'uploading', percent: 8 });
    const response = await apiClient.post<Job>('/api/ai/scan-jobs', form, {
      params: inventoryContext, signal, timeout: 20_000,
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (event) => {
        if (!uploadDone && !signal.aborted && event.total) onProgress({ stage: 'uploading', percent: 8 + Math.round(12 * Math.min(1, event.loaded / event.total)) });
      },
    });
    uploadDone = true;
    jobId = response.data.id;
    let job = response.data;
    let failures = 0;
    while (true) {
      if (signal.aborted) throw new Error('Đã huỷ quét.');
      if (job.status === 'failed') throw new Error(job.error?.message || 'Chưa thể nhận diện ảnh. Vui lòng thử lại.');
      if (job.status === 'cancelled') throw new Error('Lượt quét đã được huỷ.');
      if (job.status === 'completed') {
        if (!job.result || !Array.isArray(job.result.foods)) throw new Error('Kết quả quét chưa hợp lệ. Vui lòng thử lại.');
        const batch: ScanBatch = {
          jobId: job.id, imageUrl: prepared.uri,
          scanResultId: job.result.scanResultId, capturedAt: job.result.capturedAt, width: prepared.width, height: prepared.height,
          results: job.result.foods.map((food, index) => recognitionToScanResult(food, prepared.uri, `${job.id}-${index}`)),
          warnings: job.result.warnings ?? [], inventoryContext: job.result.inventoryContext,
        };
        onProgress({ stage: 'completed', percent: 100 });
        completed = true;
        return batch;
      }
      onProgress({ stage: job.stage, percent: Math.min(99, job.progress) });
      if (Date.now() - startedAt >= 75_000) throw new Error('Quét mất nhiều thời gian hơn dự kiến. Bạn có thể thử lại với ảnh này.');
      await wait(job.status === 'queued' ? 1200 : 900, signal);
      try {
        job = (await apiClient.get<Job>(`/api/ai/scan-jobs/${job.id}`, { signal, timeout: 8_000 })).data;
        failures = 0;
      } catch (error: any) {
        if (signal.aborted || error.response || ++failures >= 3) throw error;
        // Brief connection drops can recover without starting another AI call.
      }
    }
  } catch (error: any) {
    if (signal.aborted) throw new Error('Đã huỷ quét.');
    const status = error?.response?.status;
    const fallback = error?.code === 'ECONNABORTED' ? 'Kết nối quá chậm. Hãy kiểm tra mạng và thử lại.'
      : error?.message === 'Network Error' ? 'Mất kết nối tới máy chủ. Ảnh vẫn được giữ để bạn thử lại.' : error?.message;
    throw new Error(error?.response?.data?.message || (status === 401 ? 'Phiên đăng nhập đã hết hạn.' : fallback) || 'Chưa thể quét ảnh. Vui lòng thử lại.');
  } finally {
    if (jobId && !completed) void apiClient.delete(`/api/ai/scan-jobs/${jobId}`, { timeout: 3000 }).catch(() => {});
  }
}
