// src/screens/login.tsx
import React, { useState } from 'react';
import {
  ImageBackground,
  View,
  Text,
  TextInput,
  Pressable,
  Image,
  StyleSheet,
  Alert,
} from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../navigation/AuthNavigator';
import { useTheme } from '../utils/theme';

const logo       = require('../assets/logo.png');

type LoginNavProp = NativeStackNavigationProp<AuthStackParamList, 'Login'>;
interface Props { navigation: LoginNavProp; }

export default function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { colors, typography, backgroundImage } = useTheme();

  const handleLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      Alert.alert('Login Failed', err.message);
    }
  };

  return (
    <ImageBackground
      source={backgroundImage}
      style={[styles.container, { backgroundColor: colors.background }]}
      imageStyle={styles.bgImage}
    >
      <View style={styles.overlay}>
        <Image source={logo} style={styles.logoTop} />
        <Text style={[styles.appName, { color: typography.textColor, fontSize: 28, fontWeight: '600' }]}>EverCare</Text>
        <Text style={[styles.title, { color: typography.textColor, fontSize: typography.fontSize + 20, fontWeight: typography.fontWeight }]}>Login</Text>

        <TextInput
          placeholder="Email"
          placeholderTextColor={colors.textSecondary}
          style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <TextInput
          placeholder="Password"
          placeholderTextColor={colors.textSecondary}
          style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <Pressable style={[styles.button, { backgroundColor: colors.success }]} onPress={handleLogin}>
          <Text style={[styles.buttonText, { color: colors.card, fontSize: typography.fontSize, fontWeight: typography.fontWeight }]}>Sign In</Text>
        </Pressable>

        <Pressable onPress={() => navigation.navigate('Signup')}>
          <Text style={[styles.link, { color: colors.primary, fontSize: typography.fontSize - 2 }]}>Don't have an account? Sign up</Text>
        </Pressable>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  bgImage: {
    opacity: 0.6,
  },
  overlay: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoTop: {
    width: 100,
    height: 100,
    resizeMode: 'contain',
    marginBottom: 8,
  },
  appName: {
    marginBottom: 16,
  },
  title: {
    marginBottom: 24,
  },
  input: {
    width: '100%',
    borderRadius: 6,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  button: {
    width: '100%',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginVertical: 12,
  },
  buttonText: {
    fontWeight: '600',
  },
  link: {
    marginTop: 12,
  },
});
