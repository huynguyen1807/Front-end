<<<<<<< HEAD
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
=======
import Constants, { ExecutionEnvironment } from 'expo-constants';
>>>>>>> origin/main
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

let notificationsPromise: Promise<typeof import('expo-notifications')> | null = null;

function getNotifications() {
  // Importing this module already registers native push listeners. Load it only
  // in a supported client, so Expo Go never attempts to initialize remote push.
  if (!notificationsPromise) {
    notificationsPromise = import('expo-notifications').then((notifications) => {
      notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldPlaySound: true,
          shouldSetBadge: true,
          shouldShowBanner: true,
          shouldShowList: true,
        }),
      });
      return notifications;
    }).catch((error) => {
      notificationsPromise = null;
      throw error;
    });
  }
  return notificationsPromise;
}

/**
 * Đăng ký nhận push notification và gửi token lên server.
 * Gọi một lần sau khi user đăng nhập thành công.
 */
export async function registerForPushNotifications(): Promise<void> {
  if (Platform.OS === 'web' || Constants.executionEnvironment === ExecutionEnvironment.StoreClient) {
    return;
  }

  try {
<<<<<<< HEAD
    // Push notification chỉ hoạt động trên thiết bị thật (không phải emulator)
    if (Platform.OS === 'web') return;
    // Expo Go (SDK 53+) không hỗ trợ remote push; tránh xin quyền và lấy token vô ích.
    if (Constants.appOwnership === 'expo') return;

=======
    const projectId = getExpoProjectId();
    if (!projectId) return;

    const Notifications = await getNotifications();

    // Android needs a channel before requesting notification permissions.
>>>>>>> origin/main
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'FreshFriends',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#4CAF50',
      });
    }

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
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId,
    });
    const token = tokenData.data;

    // Gửi token lên server để lưu
    await apiClient.patch('/api/users/push-token', { token });
<<<<<<< HEAD
    console.log('[PushNotification] Đã đăng ký push token:', token);

=======
    console.log('[PushNotification] Đã đăng ký thông báo.');
>>>>>>> origin/main
  } catch (error) {
    // Không throw — lỗi đăng ký push không được làm crash app
    console.warn('[PushNotification] Chưa đăng ký được thông báo; bạn vẫn có thể sử dụng ứng dụng.', error);
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
