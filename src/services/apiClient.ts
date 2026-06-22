import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { appConfig } from '../config/env';

export const apiClient = axios.create({
  baseURL: appConfig.apiUrl,
  headers: {
    'Content-Type': 'application/json',
    'Bypass-Tunnel-Reminder': 'true', // Bypass localtunnel warning page
    'ngrok-skip-browser-warning': 'true' // Bypass ngrok warning page
  },
});

console.log('🌍 [NETWORK DEBUG] App is connecting to Backend at:', appConfig.apiUrl);

apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      // Ignored
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
