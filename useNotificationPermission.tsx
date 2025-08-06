import { NativeModules, Alert, Platform } from 'react-native';
import { useEffect, useState, useCallback } from 'react';

// Type definitions for the native module
interface NotificationPermissionModule {
  areNotificationsEnabled(): Promise<boolean>;
  openNotificationSettings(): void;
  openAppSettings(): void;
  getNotificationInfo(): Promise<string>;
}

// Get the native module with proper typing
const NotificationPermission = NativeModules.NotificationPermission as NotificationPermissionModule;

// Hook return type
interface UseNotificationPermissionReturn {
  hasPermission: boolean | null;
  loading: boolean;
  checkPermission: () => Promise<boolean>;
  requestPermission: () => void;
  getDebugInfo: () => Promise<void>;
  showNotificationInstructions: () => void;
}

export const useNotificationPermission = (): UseNotificationPermissionReturn => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const checkPermission = useCallback(async (): Promise<boolean> => {
    try {
      setLoading(true);
      if (Platform.OS !== 'android') {
        setHasPermission(true);
        return true;
      }
      
      const enabled = await NotificationPermission.areNotificationsEnabled();
      setHasPermission(enabled);
      //console.log('Notification permission check:', enabled);
      return enabled;
    } catch (error) {
      console.error('Error checking notification permission:', error);
      setHasPermission(false);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const requestPermission = useCallback((): void => {
    if (Platform.OS !== 'android') {
      Alert.alert('Info', 'Notification settings are handled automatically on iOS');
      return;
    }

    Alert.alert(
      'Enable Notifications',
      'This app needs notification permission to send you important health alerts and appointment reminders.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Open Settings', 
          onPress: () => {
            try {
              NotificationPermission.openNotificationSettings();
            } catch (error) {
              console.error('Error opening notification settings:', error);
            }
          }
        }
      ]
    );
  }, []);

  const getDebugInfo = async (): Promise<void> => {
    try {
      if (Platform.OS !== 'android') {
        Alert.alert('Debug Info', 'Platform: iOS\nNotifications: System managed');
        return;
      }

      const info = await NotificationPermission.getNotificationInfo();
      console.log('Notification Debug Info:', info);
      Alert.alert('Debug Info', info);
    } catch (error) {
      console.error('Error getting debug info:', error);
      Alert.alert('Error', `Could not get debug info: ${(error as Error).message}`);
    }
  };

  const showNotificationInstructions = useCallback((): void => {
    Alert.alert(
      'Enable Notifications',
      'This app needs notification permission to alert you about important health events and reminders.',
      [
        { text: 'Later', style: 'cancel' },
        { text: 'Enable', onPress: requestPermission }
      ]
    );
  }, [requestPermission]);

  useEffect(() => {
    // Check permission when component mounts
    checkPermission();
  }, []);

  return {
    hasPermission,
    loading,
    checkPermission,
    requestPermission,
    getDebugInfo,
    showNotificationInstructions
  };
};