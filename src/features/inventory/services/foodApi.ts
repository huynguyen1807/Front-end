import { apiClient } from '../../../services/apiClient';

// ─── Food Items ───────────────────────────────────────────────────────────────
export const getFoodsApi = async (filter?: 'SAFE' | 'NEAR_EXPIRY' | 'EXPIRED') => {
  const params = filter ? { filter } : {};
  const res = await apiClient.get('/api/foods', { params });
  return res.data.data;
};

export const getFoodSummaryApi = async () => {
  const res = await apiClient.get('/api/foods/summary');
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
}) => {
  const res = await apiClient.post('/api/foods', data);
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
}>) => {
  const res = await apiClient.put(`/api/foods/${id}`, data);
  return res.data.data;
};

export const deleteFoodApi = async (id: string) => {
  const res = await apiClient.delete(`/api/foods/${id}`);
  return res.data;
};

export const consumeFoodApi = async (id: string) => {
  const res = await apiClient.patch(`/api/foods/${id}/consume`);
  return res.data;
};

// ─── Storage Locations ────────────────────────────────────────────────────────
export const getStorageLocationsApi = async () => {
  const res = await apiClient.get('/api/storage-locations');
  return res.data.data;
};

export const createStorageLocationApi = async (data: {
  storageName: string;
  storageType: string;
  description?: string;
  isDefault?: boolean;
}) => {
  const res = await apiClient.post('/api/storage-locations', data);
  return res.data.data;
};

export const deleteStorageLocationApi = async (id: string) => {
  const res = await apiClient.delete(`/api/storage-locations/${id}`);
  return res.data;
};

// ─── Storage Suggestion ───────────────────────────────────────────────────────
export const getStorageSuggestionApi = async (categoryId: string) => {
  const res = await apiClient.get('/api/storage/suggestion', { params: { categoryId } });
  return res.data.data;
};
