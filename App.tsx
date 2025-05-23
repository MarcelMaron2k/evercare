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
    // Check and setup notification permissions when app starts
    const setupNotifications = async () => {
      if (user) { // Only check after user is authenticated
        const enabled = await checkPermission();
        
        if (!enabled) {
          // Wait a bit then show setup instructions for Galaxy devices
          setTimeout(() => {
            showGalaxyInstructions();
          }, 3000); // Wait 3 seconds after login
        }
      }
    };

    setupNotifications();
  }, [user, checkPermission, showGalaxyInstructions]); // Run when user logs in

  return (
    <NavigationContainer>
      {user ? <AppNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}