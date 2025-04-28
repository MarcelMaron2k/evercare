// src/screens/Splash.tsx
import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { auth, db } from '../firebase';

type RootStackParamList = {
  Splash:  undefined;
  Login:   undefined;
  Signup:  undefined;
  // you can add Home, Medications, etc. here too if you include Splash in your navigator
};

type SplashNavProp = NativeStackNavigationProp<RootStackParamList, 'Splash'>;

export default function SplashScreen() {
  const navigation = useNavigation<SplashNavProp>();

  useEffect(() => {
    const timeout = setTimeout(() => {
      navigation.replace('Login');
    }, 2000); // 2-second splash delay
    return () => clearTimeout(timeout);
  }, [navigation]);

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Splash Screen</Text>
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
  },
});
