import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import AuthNavigator from './navigation/AuthNavigator';
import AppNavigator from './navigation/AppNavigator';
import { useNotificationPermission } from './useNotificationPermission';

export default function App() {
  const [user, setUser] = useState<null | object>(null);
  
  // Add notification permission hook
  const { 
    hasPermission, 
    checkPermission, 
    showGalaxyInstructions 
  } = useNotificationPermission();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return unsubscribe;
  }, []);

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

  return (
    <NavigationContainer>
      {user ? <AppNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}