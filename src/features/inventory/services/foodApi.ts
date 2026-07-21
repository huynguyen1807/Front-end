import { apiClient } from '../../../services/apiClient';

// ─── Image Upload ─────────────────────────────────────────────────────────────
export const uploadImageApi = async (imageUri: string): Promise<{ url: string; publicId: string }> => {
  const formData = new FormData();

  // Get file name from URI
  const fileName = imageUri.split('/').pop() || 'photo.jpg';
  const match = /\.(\w+)$/.exec(fileName);
  const fileType = match ? `image/${match[1]}` : 'image/jpeg';

  formData.append('image', {
    uri: imageUri,
    name: fileName,
    type: fileType,
  } as any);

  const res = await apiClient.post('/api/upload/image', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return res.data.data;
};

export type NutritionSnapshotPayload = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  baseQuantity: number;
  unit: string;
  source: 'SCAN_AI' | 'ADMIN' | 'CATEGORY_ESTIMATE';
  confidence?: number;
};

// ─── Food Items ───────────────────────────────────────────────────────────────
export const getFoodsApi = async (filter?: 'SAFE' | 'NEAR_EXPIRY' | 'EXPIRED' | 'NEED_CHECK', ownerType?: string, householdId?: string) => {
  const params: any = filter ? { filter } : {};
  if (ownerType) params.ownerType = ownerType;
  if (householdId) params.householdId = householdId;
  const res = await apiClient.get('/api/foods', { params });
  return res.data.data;
};

export const getFoodSummaryApi = async (ownerType?: string, householdId?: string) => {
  const params: any = {};
  if (ownerType) params.ownerType = ownerType;
  if (householdId) params.householdId = householdId;
  const res = await apiClient.get('/api/foods/summary', { params });
  return res.data.data;
};

export const getFoodCategoriesApi = async () => {
  const res = await apiClient.get('/api/foods/categories');
  return res.data.data;
};

export const getFoodByIdApi = async (id: string) => {
  const res = await apiClient.get(`/api/foods/${id}`);
  return res.data.data;
};

export const createFoodApi = async (data: {
  categoryId: string;
  storageLocationId: string;
  foodName: string;
  imageUrl?: string;
  sourceType: 'SUPERMARKET' | 'MARKET';
  expiryType: 'MANUAL' | 'SCANNED' | 'AI_PREDICTED';
  purchaseDate: string;
  expiryDate: string;
  quantity: number;
  unit: string;
  nutritionSnapshot?: NutritionSnapshotPayload;
}, ownerType?: string, householdId?: string) => {
  const params: any = {};
  if (ownerType) params.ownerType = ownerType;
  if (householdId) params.householdId = householdId;
  const res = await apiClient.post('/api/foods', data, { params });
  return res.data.data;
};

export const updateFoodApi = async (id: string, data: Partial<{
  foodName: string;
  categoryId: string;
  storageLocationId: string;
  purchaseDate: string;
  expiryDate: string;
  quantity: number;
  unit: string;
  imageUrl: string;
  sourceType: 'SUPERMARKET' | 'MARKET';
  expiryType: 'MANUAL' | 'SCANNED' | 'AI_PREDICTED';
  nutritionSnapshot: NutritionSnapshotPayload;
}>, ownerType?: string, householdId?: string) => {
  const params: any = {};
  if (ownerType) params.ownerType = ownerType;
  if (householdId) params.householdId = householdId;
  const res = await apiClient.put(`/api/foods/${id}`, data, { params });
  return res.data.data;
};

export const deleteFoodApi = async (id: string, ownerType?: string, householdId?: string) => {
  const params: any = {};
  if (ownerType) params.ownerType = ownerType;
  if (householdId) params.householdId = householdId;
  const res = await apiClient.delete(`/api/foods/${id}`, { params });
  return res.data;
};

export const consumeFoodApi = async (id: string, ownerType?: string, householdId?: string) => {
  const params: any = {};
  if (ownerType) params.ownerType = ownerType;
  if (householdId) params.householdId = householdId;
  const res = await apiClient.patch(`/api/foods/${id}/consume`, {}, { params });
  return res.data;
};

// ─── Storage Locations ────────────────────────────────────────────────────────
export const getStorageLocationsApi = async (ownerType?: string, householdId?: string) => {
  const params: any = {};
  if (ownerType) params.ownerType = ownerType;
  if (householdId) params.householdId = householdId;
  const res = await apiClient.get('/api/storage-locations', { params });
  return res.data.data;
};

export const createStorageLocationApi = async (data: {
  storageName: string;
  storageType: string;
  description?: string;
  isDefault?: boolean;
}, ownerType?: string, householdId?: string) => {
  const params: any = {};
  if (ownerType) params.ownerType = ownerType;
  if (householdId) params.householdId = householdId;
  const res = await apiClient.post('/api/storage-locations', data, { params });
  return res.data.data;
};

export const deleteStorageLocationApi = async (id: string, ownerType?: string, householdId?: string) => {
  const params: any = {};
  if (ownerType) params.ownerType = ownerType;
  if (householdId) params.householdId = householdId;
  const res = await apiClient.delete(`/api/storage-locations/${id}`, { params });
  return res.data;
};

// ─── Storage Suggestion ───────────────────────────────────────────────────────
export const getStorageSuggestionApi = async (categoryId: string, ownerType?: string, householdId?: string) => {
  const params: any = { categoryId };
  if (ownerType) params.ownerType = ownerType;
  if (householdId) params.householdId = householdId;
  const res = await apiClient.get('/api/storage/suggestion', { params });
  return res.data.data;
};
