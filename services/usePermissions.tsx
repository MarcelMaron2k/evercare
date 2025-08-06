import { useState, useEffect, useCallback } from 'react';
import { PermissionsAndroid, Platform, Alert, NativeModules } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Type definitions for the native notification module
interface NotificationPermissionModule {
  areNotificationsEnabled(): Promise<boolean>;
  openNotificationSettings(): void;
  openAppSettings(): void;
  getNotificationInfo(): Promise<string>;
}

// Get the native module with proper typing
const NotificationPermission = NativeModules.NotificationPermission as NotificationPermissionModule;

interface PermissionsState {
  notifications: boolean | null;
  phone: boolean | null;
  location: boolean | null;
  backgroundLocation: boolean | null;
}

interface UsePermissionsReturn {
  permissions: PermissionsState;
  hasAllPermissions: boolean | null;
  requestPermissions: () => Promise<void>;
  requestNotificationPermission: () => void;
  loading: boolean;
}

export const usePermissions = (): UsePermissionsReturn => {
  const [permissions, setPermissions] = useState<PermissionsState>({
    notifications: null,
    phone: null,
    location: null,
    backgroundLocation: null
  });
  const [hasAllPermissions, setHasAllPermissions] = useState<boolean | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Check notification permissions using native module
  const checkNotificationPermission = useCallback(async (): Promise<boolean> => {
    try {
      if (Platform.OS !== 'android') {
        setPermissions(prev => ({ ...prev, notifications: true }));
        return true;
      }
      
      const enabled = await NotificationPermission.areNotificationsEnabled();
      setPermissions(prev => ({ ...prev, notifications: enabled }));
      return enabled;
    } catch (error) {
      console.error('Error checking notification permission:', error);
      setPermissions(prev => ({ ...prev, notifications: false }));
      return false;
    }
  }, []);

  // Request notification permission using native module  
  const requestNotificationPermission = useCallback((): void => {
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

  const checkPermissions = async (): Promise<boolean> => {
    if (Platform.OS !== 'android') {
      setPermissions({
        notifications: true,
        phone: true,
        location: true,
        backgroundLocation: true
      });
      setHasAllPermissions(true);
      return true;
    }

    try {
      // Check all permissions individually
      const [notificationResult, phoneResult, locationResult, backgroundLocationResult] = await Promise.all([
        checkNotificationPermission(),
        PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.CALL_PHONE),
        PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION),
        PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION)
      ]);

      // Update individual permissions
      setPermissions(prev => ({
        ...prev,
        phone: phoneResult,
        location: locationResult,
        backgroundLocation: backgroundLocationResult
      }));

      // Check if all permissions are granted
      const allGranted = notificationResult && phoneResult && locationResult;
      setHasAllPermissions(allGranted);
      return allGranted;
    } catch (error) {
      console.error('Error checking permissions:', error);
      setHasAllPermissions(false);
      return false;
    }
  };

  const requestPermissions = useCallback(async (): Promise<void> => {
    if (Platform.OS !== 'android') {
      console.log('Not Android platform, skipping permission requests');
      return;
    }

    console.log('Starting permission request process...');
    try {
      setLoading(true);
      
      // Check if PermissionsAndroid is available
      if (!PermissionsAndroid) {
        console.error('PermissionsAndroid is not available');
        return;
      }

      // Build permissions array
      const basicPermissions = [
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
        PermissionsAndroid.PERMISSIONS.CALL_PHONE,
      ];

      // Add POST_NOTIFICATIONS for Android 13+ (API 33+)
      if (Platform.Version >= 33) {
        basicPermissions.push(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
      }

      console.log('Requesting basic permissions...', basicPermissions);
      
      // Request permissions individually with proper rationale
      const basicResults: {[key: string]: any} = {};
      
      for (const permission of basicPermissions) {
        let rationale;
        switch (permission) {
          case PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION:
          case PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION:
            rationale = {
              title: 'Location Permission',
              message: 'EverCare needs access to your location for emergency services and finding nearby healthcare providers.',
              buttonPositive: 'Allow',
              buttonNegative: 'Deny',
            };
            break;
          case PermissionsAndroid.PERMISSIONS.CALL_PHONE:
            rationale = {
              title: 'Phone Permission',
              message: 'EverCare needs permission to make emergency calls when needed.',
              buttonPositive: 'Allow',
              buttonNegative: 'Deny',
            };
            break;
          case PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS:
            rationale = {
              title: 'Notification Permission',
              message: 'EverCare needs notification permission to send you important health alerts, fall detection warnings, and appointment reminders.',
              buttonPositive: 'Allow',
              buttonNegative: 'Deny',
            };
            break;
        }
        
        const result = await PermissionsAndroid.request(permission, rationale);
        basicResults[permission] = result;
      }
      console.log('Basic permission results:', basicResults);

      // For Android 13+, check if POST_NOTIFICATIONS was granted
      // For older versions, use the native module check
      let notificationGranted = false;
      if (Platform.Version >= 33) {
        notificationGranted = basicResults[PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS] === PermissionsAndroid.RESULTS.GRANTED;
      } else {
        notificationGranted = await checkNotificationPermission();
      }
      
      if (!notificationGranted) {
        // Show notification setup instructions for older devices
        if (Platform.Version < 33) {
          requestNotificationPermission();
        }
      }

      // Check if location permissions were granted
      const locationGranted = 
        basicResults[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION] === PermissionsAndroid.RESULTS.GRANTED ||
        basicResults[PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION] === PermissionsAndroid.RESULTS.GRANTED;

      // If location permissions granted, request background location
      if (locationGranted) {
        console.log('Requesting background location permission...');
        const backgroundLocationResult = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION,
          {
            title: 'Background Location Permission',
            message: 'EverCare needs to access your location in the background for emergency services and location-based health features.',
            buttonPositive: 'Allow',
            buttonNegative: 'Deny',
          }
        );

        console.log('Background location result:', backgroundLocationResult);
      }

      // Check final permission status
      const finalStatus = await checkPermissions();
      
      // Show results to user
      const deniedPermissions: string[] = [];
      
      Object.entries(basicResults).forEach(([permission, result]) => {
        if (result !== PermissionsAndroid.RESULTS.GRANTED) {
          switch (permission) {
            case PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION:
            case PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION:
              if (!deniedPermissions.includes('Location')) {
                deniedPermissions.push('Location');
              }
              break;
            case PermissionsAndroid.PERMISSIONS.CALL_PHONE:
              deniedPermissions.push('Phone Calls');
              break;
            case PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS:
              deniedPermissions.push('Notifications');
              break;
          }
        }
      });

      // Check if this is the first time requesting permissions
      const hasRequestedBefore = await AsyncStorage.getItem('permissions_requested');
      
      if (deniedPermissions.length > 0) {
        Alert.alert(
          'Permissions Required',
          `The following permissions were denied: ${deniedPermissions.join(', ')}.\n\nSome app features may not work properly without these permissions.`,
          [{ text: 'OK' }]
        );
      } else if (!hasRequestedBefore) {
        // Only show success message on first successful permission grant
        Alert.alert(
          'Permissions Granted',
          'All permissions have been granted. EverCare is ready to use.',
          [{ text: 'OK' }]
        );
      }

      // Mark that permissions have been requested
      await AsyncStorage.setItem('permissions_requested', 'true');

    } catch (error) {
      console.error('Error requesting permissions:', error);
      console.error('Error details:', JSON.stringify(error));
      
      // Don't show alert on splash screen, just log
      console.log('Permission request failed, continuing anyway');
      
      // Set permissions as false so app can continue
      setHasAllPermissions(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Check permissions when component mounts
    const initPermissions = async () => {
      await checkPermissions();
      setLoading(false);
    };
    initPermissions();
  }, []);

  return {
    permissions,
    hasAllPermissions,
    requestPermissions,
    requestNotificationPermission,
    loading,
  };
};