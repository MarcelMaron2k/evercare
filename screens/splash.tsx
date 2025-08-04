// src/screens/Splash.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { auth, db } from '../firebase';
import { usePermissions } from '../usePermissions';

type RootStackParamList = {
  Splash:  undefined;
  Login:   undefined;
  Signup:  undefined;
  // you can add Home, Medications, etc. here too if you include Splash in your navigator
};

type SplashNavProp = NativeStackNavigationProp<RootStackParamList, 'Splash'>;

export default function SplashScreen() {
  const navigation = useNavigation<SplashNavProp>();
  const isFocused = useIsFocused();
  const { hasAllPermissions, requestPermissions, loading } = usePermissions();
  const [statusText, setStatusText] = useState('Loading...');
  const [hasNavigated, setHasNavigated] = useState(false);

  useEffect(() => {
    if (hasNavigated) return; // Prevent multiple navigations

    const initializeApp = async () => {
      try {
        setStatusText('Setting up permissions...');
        console.log('Splash: Starting permission setup');
                
        // Request permissions
        console.log('Splash: Requesting permissions');
        try {
          await requestPermissions();
          setStatusText('Permissions complete!');
          console.log('Splash: Permissions done, navigating to login');
        } catch (permError) {
          console.error('Splash: Permission error:', permError);
          setStatusText('Permission setup failed, continuing...');
        }
        
        // Navigate to login after permissions are handled
        setTimeout(() => {
          if (!hasNavigated && isFocused) {
            try {
              setHasNavigated(true);
              navigation.replace('Login');
            } catch (navError) {
              console.log('Navigation failed, probably context switched:', navError);
            }
          }
        }, 1000);
        
      } catch (error) {
        console.error('Splash: Error during initialization:', error);
        setStatusText('Setup complete');
        // Navigate anyway after error
        setTimeout(() => {
          if (!hasNavigated && isFocused) {
            try {
              setHasNavigated(true);
              navigation.replace('Login');
            } catch (navError) {
              console.log('Navigation failed, probably context switched:', navError);
            }
          }
        }, 2000);
      }
    };

    initializeApp();
  }, []); // Empty dependency array - only run once on mount

  return (
    <View style={styles.container}>
      <Text style={styles.text}>EverCare</Text>
      <Text style={styles.statusText}>{statusText}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex:             1,
    justifyContent:  'center',
    alignItems:      'center',
  },
  text: {
    fontSize:  28,
    fontWeight:'bold',
    color: '#666',
    marginBottom: 20,
  },
  statusText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});
