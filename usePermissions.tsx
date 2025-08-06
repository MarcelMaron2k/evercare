import { useState, useEffect } from 'react';
import { PermissionsAndroid, Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface UsePermissionsReturn {
  hasAllPermissions: boolean | null;
  requestPermissions: () => Promise<void>;
  loading: boolean;
}

export const usePermissions = (): UsePermissionsReturn => {
  const [hasAllPermissions, setHasAllPermissions] = useState<boolean | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const checkPermissions = async (): Promise<boolean> => {
    if (Platform.OS !== 'android') {
      return true;
    }

    try {
      const permissions = [
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
        PermissionsAndroid.PERMISSIONS.CALL_PHONE,
      ];

      // Only check POST_NOTIFICATIONS if it exists
      if (PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS) {
        permissions.push(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
      }

      const results = await Promise.all(
        permissions.map(permission => PermissionsAndroid.check(permission))
      );

      // Check if all permissions are granted
      const allGranted = results.every(result => result === true);
      setHasAllPermissions(allGranted);
      return allGranted;
    } catch (error) {
      console.error('Error checking permissions:', error);
      setHasAllPermissions(false);
      return false;
    }
  };

  const requestPermissions = async (): Promise<void> => {
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

      // Only add POST_NOTIFICATIONS if it exists (Android 13+)
      if (PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS) {
        basicPermissions.push(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
        console.log('POST_NOTIFICATIONS permission available, adding to request');
      } else {
        console.log('POST_NOTIFICATIONS permission not available on this Android version');
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
              message: 'EverCare needs access to your location to record where falls occur for emergency services.',
              buttonPositive: 'Allow',
              buttonNegative: 'Deny',
            };
            break;
          case PermissionsAndroid.PERMISSIONS.CALL_PHONE:
            rationale = {
              title: 'Phone Permission',
              message: 'EverCare needs permission to make emergency calls when a fall is detected.',
              buttonPositive: 'Allow',
              buttonNegative: 'Deny',
            };
            break;
          case PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS:
            rationale = {
              title: 'Notification Permission',
              message: 'EverCare needs permission to send you notifications when a fall is detected.',
              buttonPositive: 'Allow',
              buttonNegative: 'Deny',
            };
            break;
        }
        
        const result = await PermissionsAndroid.request(permission, rationale);
        basicResults[permission] = result;
      }
      console.log('Basic permission results:', basicResults);

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
            message: 'EverCare needs to access your location even when the app is closed to detect falls and provide emergency assistance.',
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
          `The following permissions were denied: ${deniedPermissions.join(', ')}.\n\nFall detection may not work properly without these permissions.`,
          [{ text: 'OK' }]
        );
      } else if (!hasRequestedBefore) {
        // Only show success message on first successful permission grant
        Alert.alert(
          'Permissions Granted',
          'All permissions have been granted. Fall detection is now active.',
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
  };

  useEffect(() => {
    // Check permissions when component mounts
    const initPermissions = async () => {
      await checkPermissions();
      setLoading(false);
    };
    initPermissions();
  }, []);

  return {
    hasAllPermissions,
    requestPermissions,
    loading,
  };
};