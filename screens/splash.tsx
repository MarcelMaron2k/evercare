// src/screens/Splash.tsx
import React, { useEffect, useRef } from 'react';
import {
  Text,
  StyleSheet,
  ImageBackground,
  Animated,
  Dimensions,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Colors from '../styles/Colors';

const background = require('../assets/background.png');
const logo       = require('../assets/logo.png');

type RootStackParamList = {
  Splash:  undefined;
  Login:   undefined;
  Signup:  undefined;
};

type SplashNavProp = NativeStackNavigationProp<RootStackParamList, 'Splash'>;

export default function SplashScreen() {
  const navigation = useNavigation<SplashNavProp>();
  const scaleAnim  = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();

    const timeout = setTimeout(() => navigation.replace('Login'), 2000);
    return () => clearTimeout(timeout);
  }, [navigation, scaleAnim]);

  return (
    <ImageBackground
      source={background}
      style={styles.container}
      imageStyle={styles.bgImage}
    >
      <Animated.Image
        source={logo}
        style={[styles.logo, { transform: [{ scale: scaleAnim }] }]}
      />
      <Text style={styles.appName}>EverCare</Text>
    </ImageBackground>
  );
}

const { width } = Dimensions.get('window');
const LOGO_SIZE = width * 0.5;

const styles = StyleSheet.create({
  container: {
    flex:            1,
    justifyContent: 'center',
    alignItems:     'center',
  },
  bgImage: {            
    opacity: 0.6,       
  },
  logo: {
    width:       LOGO_SIZE,
    height:      LOGO_SIZE,
    resizeMode: 'contain',
  },
  appName: {
    marginTop:  16,
    fontSize:   36,
    fontWeight: '600',
    color:      Colors.blue,
  },
});
