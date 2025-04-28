// App.tsx
import React, { useState, useEffect } from 'react';
import { NavigationContainer }           from '@react-navigation/native';
import { createNativeStackNavigator }    from '@react-navigation/native-stack';
import { createBottomTabNavigator }      from '@react-navigation/bottom-tabs';
import { onAuthStateChanged }            from 'firebase/auth';
import { auth }                          from './firebase';
import SplashScreen      from './screens/splash';
import LoginScreen       from './screens/login';
import SignupScreen      from './screens/signup';
import HomeTab           from './screens/home';
import MedicationsScreen from './screens/medication';

type AuthStackParamList = {
  Splash:     undefined;
  Login:      undefined;
  Signup:     undefined;
};

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const Tab       = createBottomTabNavigator();

function AppTabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Home"        component={HomeTab} />
      <Tab.Screen name="Medications" component={MedicationsScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser]                 = useState<any>(null);

  // Watch Firebase auth state
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (initializing) setInitializing(false);
    });
    return unsub;
  }, [initializing]);

  // While we’re waiting for Firebase to initialize, render nothing (or a simple loader)
  if (initializing) {
    return null;
  }

  return (
    <NavigationContainer>
      {user ? (
        <AppTabs />
      ) : (
        <AuthStack.Navigator
          initialRouteName="Splash"
          screenOptions={{ headerShown: false }}
        >
          <AuthStack.Screen name="Splash" component={SplashScreen} />
          <AuthStack.Screen name="Login"  component={LoginScreen} />
          <AuthStack.Screen name="Signup" component={SignupScreen} />
        </AuthStack.Navigator>
      )}
    </NavigationContainer>
  );
}
