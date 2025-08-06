import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from './firebase';
import { doc, getDoc } from 'firebase/firestore';
import { NativeModules } from 'react-native';
import AuthNavigator from './navigation/AuthNavigator';
import AppNavigator from './navigation/AppNavigator';
import { SettingsProvider } from './context/SettingsContext';
import { usePermissions } from './services/usePermissions';
import { useFallDetectionService } from './services/FallDetectionService';

export default function App() {
  const [user, setUser] = useState<null | object>(null);
  const [initializing, setInitializing] = useState(true);
  const [hasShownInstructions, setHasShownInstructions] = useState(false);
  
  // Add unified permissions hook
  const { 
    permissions,
    hasAllPermissions, 
    requestPermissions,
    requestNotificationPermission,
    loading: permissionsLoading 
  } = usePermissions();

  // Initialize fall detection service
  useFallDetectionService();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (initializing) setInitializing(false);
      
      // Load and broadcast caretaker settings when user logs in
      if (user) {
        loadAndBroadcastCaretakerSettings(user);
      }
    });
    return unsubscribe;
  }, [initializing]);

  const loadAndBroadcastCaretakerSettings = async (user: any) => {
    try {
      const userDoc = doc(db, 'users', user.uid);
      const docSnap = await getDoc(userDoc);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.caretaker && data.caretaker.phone) {
          // Broadcast caretaker settings to BackgroundService
          const { SettingsModule } = NativeModules;
          if (SettingsModule) {
            await SettingsModule.refreshCaretakerSettings(
              data.caretaker.phone, 
              data.caretaker.name || ''
            );
            console.log('Caretaker settings loaded and broadcasted on startup:', {
              phone: data.caretaker.phone,
              name: data.caretaker.name
            });
          }
        } else {
          console.log('No caretaker settings found for user');
        }
      }
    } catch (error) {
      console.error('Error loading caretaker settings on startup:', error);
    }
  };

  useEffect(() => {
    // Request all permissions when user logs in
    const setupPermissions = async () => {
      if (user && !hasShownInstructions && !permissionsLoading) {
        // Wait a bit then request all permissions
        setTimeout(() => {
          requestPermissions();
          setHasShownInstructions(true);
        }, 2000);
      }
    };

    setupPermissions();
  }, [user, hasShownInstructions, permissionsLoading, requestPermissions]);

  // Show AuthNavigator while initializing or when no user
  return (
    <SettingsProvider>
      <NavigationContainer>
        {!initializing && user ? <AppNavigator /> : <AuthNavigator />}
      </NavigationContainer>
    </SettingsProvider>
  );
}