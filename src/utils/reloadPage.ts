import { Platform } from 'react-native';

// Web refresh buttons behave like F5; native screens refetch their data.
export function reloadPageOrRefresh(refresh: () => unknown): void {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.location.reload();
    return;
  }
  void refresh();
}
