import { apiClient } from '../../../services/apiClient';

export const loginApi = async (credentials: any) => {
  const response = await apiClient.post('/api/auth/login', credentials);
  return response.data;
};

export const registerApi = async (userData: any) => {
  const response = await apiClient.post('/api/auth/register', userData);
  return response.data;
};

export const verifyOTPApi = async (email: string, otp: string) => {
  const response = await apiClient.post('/api/auth/verify-otp', { email, otp });
  return response.data;
};

export const resendOTPApi = async (email: string) => {
  const response = await apiClient.post('/api/auth/resend-otp', { email });
  return response.data;
};

export const googleLoginApi = async (accessToken: string) => {
  const response = await apiClient.post('/api/auth/google', { accessToken });
  return response.data;
};

export const forgotPasswordApi = async (email: string) => {
  const response = await apiClient.post('/api/auth/forgot-password', { email });
  return response.data;
};

export const resetPasswordApi = async (data: any) => {
  const response = await apiClient.post('/api/auth/reset-password', data);
  return response.data;
};
