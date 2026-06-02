import { appConfig } from 'config/env';
import type { ApiHealthResponse } from 'types/api';

async function request<T>(path: string): Promise<T> {
  const response = await fetch(`${appConfig.apiUrl}${path}`);

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export const apiClient = {
  getHealth: () => request<ApiHealthResponse>('/api/health')
};
