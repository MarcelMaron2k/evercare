import { useEffect } from 'react';
import { DeviceEventEmitter, NativeModules, Platform } from 'react-native';
import { collection, addDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

interface FallEventData {
  acceleration: number;
  duration: number;
  timestamp: number;
  latitude?: number;
  longitude?: number;
  accuracy?: number;
  provider?: string;
  locationTimestamp?: number;
}

export const useFallDetectionService = () => {
  useEffect(() => {
    if (Platform.OS !== 'android') {
      console.log('FallDetectionService: Not Android, skipping');
      return;
    }

    console.log('FallDetectionService: Setting up fall detection listener');

    // Start the foreground service
    const { ForegroundServiceModule } = NativeModules;
    if (ForegroundServiceModule) {
      ForegroundServiceModule.startForegroundService()
        .then((result: string) => {
          console.log('FallDetectionService: Foreground service started -', result);
        })
        .catch((error: any) => {
          console.error('FallDetectionService: Failed to start foreground service -', error);
        });
    } else {
      console.log('FallDetectionService: ForegroundServiceModule not available');
    }

    const subscription = DeviceEventEmitter.addListener(
      'FREE_FALL_DETECTED',
      async (eventData: FallEventData) => {
        console.log('Fall detected event received:', eventData);
        
        try {
          const currentUser = auth.currentUser;
          if (!currentUser) {
            console.log('No authenticated user - cannot save fall event');
            return;
          }

          // Create fall event data
          const fallEvent: any = {
            timestamp: new Date(eventData.timestamp),
            acceleration: eventData.acceleration,
            duration: eventData.duration,
            deviceInfo: 'React Native App',
            userId: currentUser.uid,
            readableTimestamp: new Date(eventData.timestamp).toISOString(),
          };

          // Add location data if available
          if (eventData.latitude && eventData.longitude) {
            fallEvent.location = {
              latitude: eventData.latitude,
              longitude: eventData.longitude,
              accuracy: eventData.accuracy,
              provider: eventData.provider,
              locationTimestamp: new Date(eventData.locationTimestamp || eventData.timestamp),
            };
          } else {
            fallEvent.location = null;
          }

          // Save to Firestore
          const fallsCollection = collection(db, 'users', currentUser.uid, 'falls');
          const docRef = await addDoc(fallsCollection, fallEvent);
          
          console.log('Fall event saved to Firebase with ID:', docRef.id);
          
        } catch (error) {
          console.error('Error saving fall event to Firebase:', error);
        }
      }
    );

    return () => {
      console.log('FallDetectionService: Cleaning up fall detection listener');
      subscription.remove();
      
      // Stop the foreground service
      const { ForegroundServiceModule } = NativeModules;
      if (ForegroundServiceModule) {
        ForegroundServiceModule.stopForegroundService()
          .then((result: string) => {
            console.log('FallDetectionService: Foreground service stopped -', result);
          })
          .catch((error: any) => {
            console.error('FallDetectionService: Failed to stop foreground service -', error);
          });
      }
    };
  }, []);
};