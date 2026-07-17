import { apiClient } from '../../../services/apiClient';

export const getMeApi = async () => {
  const response = await apiClient.get('/api/auth/me');
  return response.data;
};

export const updateProfileApi = async (data: { fullName?: string; phoneNumber?: string }) => {
  const response = await apiClient.put('/api/users/profile', data);
  return response.data;
};

export const updatePreferencesApi = async (data: { notificationsEnabled?: boolean; darkMode?: boolean; language?: string }) => {
  const response = await apiClient.put('/api/users/preferences', data);
  return response.data;
};
