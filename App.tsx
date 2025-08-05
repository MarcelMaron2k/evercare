// App.tsx
import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { onAuthStateChanged }  from 'firebase/auth';
import { auth }                from './firebase';
import AuthNavigator           from './navigation/AuthNavigator';
import AppNavigator            from './navigation/AppNavigator';
import { SettingsProvider }    from './context/SettingsContext';

export default function App() {
  const [user, setUser] = useState<null | object>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return unsubscribe;
  }, []);

  return (
    <SettingsProvider>
      <NavigationContainer>
        {user ? <AppNavigator /> : <AuthNavigator />}
      </NavigationContainer>
    </SettingsProvider>
  );
}
