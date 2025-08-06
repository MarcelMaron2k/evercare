import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import AuthNavigator from './navigation/AuthNavigator';
import AppNavigator from './navigation/AppNavigator';
import { SettingsProvider } from './context/SettingsContext';
import { useNotificationPermission } from './useNotificationPermission';
import { useFallDetectionService } from './services/FallDetectionService';

export default function App() {
  const [user, setUser] = useState<null | object>(null);
  const [initializing, setInitializing] = useState(true);
  
  // Add notification permission hook
  const { 
    hasPermission, 
    checkPermission, 
    showGalaxyInstructions 
  } = useNotificationPermission();

  // Initialize fall detection service
  useFallDetectionService();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (initializing) setInitializing(false);
    });
    return unsubscribe;
  }, [initializing]);

  useEffect(() => {
    // Check notification permissions when user logs in
    const setupNotifications = async () => {
      if (user) {
        const notificationEnabled = await checkPermission();
        if (!notificationEnabled) {
          // Wait a bit then show setup instructions for Galaxy devices
          setTimeout(() => {
            showGalaxyInstructions();
          }, 2000);
        }
      }
    };

    setupNotifications();
  }, [user, checkPermission, showGalaxyInstructions]);

  // Show AuthNavigator while initializing or when no user
  return (
    <SettingsProvider>
      <NavigationContainer>
        {!initializing && user ? <AppNavigator /> : <AuthNavigator />}
      </NavigationContainer>
    </SettingsProvider>
  );
}