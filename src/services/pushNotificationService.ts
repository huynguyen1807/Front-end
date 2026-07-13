import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import appJson from '../../app.json';
import { apiClient } from './apiClient';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function getExpoProjectId(): string | null {
  const projectId = appJson.expo?.extra?.eas?.projectId;

  if (typeof projectId !== 'string' || !UUID_PATTERN.test(projectId)) {
    console.warn(
      '[PushNotification] Invalid Expo EAS projectId. Check app.json -> expo.extra.eas.projectId.'
    );
    return null;
  }

  return projectId;
}

// Cấu hình hiển thị notification khi app đang foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Đăng ký nhận push notification và gửi token lên server.
 * Gọi một lần sau khi user đăng nhập thành công.
 */
export async function registerForPushNotifications(): Promise<void> {
  try {
    // Push notification chỉ hoạt động trên thiết bị thật (không phải emulator)
    if (Platform.OS === 'web') return;

    // Xin quyền
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('[PushNotification] Người dùng từ chối quyền thông báo.');
      return;
    }

    // Lấy Expo Push Token
    const projectId = getExpoProjectId();
    if (!projectId) return;

    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId,
    });
    const token = tokenData.data;

    // Gửi token lên server để lưu
    await apiClient.patch('/api/users/push-token', { token });
    console.log('[PushNotification] Đã đăng ký push token:', token);

    // Cấu hình notification channel cho Android
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'FreshFriends',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#4CAF50',
      });
    }
  } catch (error) {
    // Không throw — lỗi đăng ký push không được làm crash app
    console.error('[PushNotification] Lỗi đăng ký:', error);
  }
}

/**
 * Xoá push token khi user đăng xuất.
 */
export async function unregisterPushNotifications(): Promise<void> {
  try {
    await apiClient.patch('/api/users/push-token', { token: null });
  } catch (_) {
    // Bỏ qua lỗi khi logout
  }
}
