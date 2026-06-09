import { useState, useEffect } from 'react';
import { Camera } from 'expo-camera';
import { Platform, AppState } from 'react-native';

type PermissionStatus = 'granted' | 'denied' | 'undetermined';

export const useCameraPermissions = () => {
  const [permission, setPermission] = useState<PermissionStatus>('undetermined');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let appStateSubscription: any;
    
    const requestPermissions = async () => {
      try {
        setIsLoading(true);
        const cameraPermission = await Camera.requestCameraPermissionsAsync();
        
        setPermission(
          cameraPermission.status === 'granted' 
            ? 'granted' 
            : cameraPermission.status === 'denied'
            ? 'denied'
            : 'undetermined'
        );
      } catch (error) {
        console.error('Error requesting camera permissions:', error);
        setPermission('denied');
      } finally {
        setIsLoading(false);
      }
    };

    const handleAppStateChange = async (state: string) => {
      if (state === 'active') {
        // Re-check permissions when app comes to foreground
        const cameraPermission = await Camera.getCameraPermissionsAsync();
        setPermission(
          cameraPermission.status === 'granted' 
            ? 'granted' 
            : cameraPermission.status === 'denied'
            ? 'denied'
            : 'undetermined'
        );
      }
    };

    requestPermissions();
    
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, []);

  return { permission, isLoading };
};
