import Constants from 'expo-constants';
import { Platform } from 'react-native';

const getApiUrl = () => {
  // Tự động lấy IP mạng LAN của máy tính đang chạy Expo
  const debuggerHost = Constants.expoConfig?.hostUri;
  const localhost = debuggerHost?.split(':')[0];

  if (localhost) {
    return `http://${localhost}:4000`; // Trỏ về backend đang chạy ở port 4000
  }

  // Fallback trong trường hợp không lấy được (môi trường máy ảo độc lập)
  if (Platform.OS === 'ios') {
    return 'http://localhost:4000';
  }
  return 'http://10.0.2.2:4000'; // Dành cho Android Emulator
};

export const appConfig = {
  apiUrl: getApiUrl(),
  googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY
};
