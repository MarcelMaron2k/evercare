import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
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
    });
    return unsubscribe;
  }, [initializing]);

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