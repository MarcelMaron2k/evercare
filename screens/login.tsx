// src/screens/login.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Alert,
  Pressable
} from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeModules } from 'react-native';

import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../navigation/AuthNavigator';

type LoginScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

interface LoginScreenProps {
  navigation: LoginScreenNavigationProp;
}

export default function LoginScreen({ navigation }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const storeUserIdNatively = async (userId: string) => {
    try {
      // Store in AsyncStorage for React Native
      await AsyncStorage.setItem('userId', userId);
      console.log('AsyncStorage: Stored userId:', userId);
      
      // Store in SharedPreferences via native module for BackgroundService access
      const { AuthStorage } = NativeModules;
      if (AuthStorage) {
        await AuthStorage.storeUserId(userId);
        console.log('Native Module: Stored userId in SharedPreferences');
      } else {
        console.log('AuthStorage native module not available');
      }
    } catch (error) {
      console.log('Error storing user ID:', error);
    }
  };

  const handleLogin = async () => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      // Store user ID for background service access
      await storeUserIdNatively(userCredential.user.uid);
      // No navigation.replace here – root App.tsx will switch flows automatically
    } catch (err: any) {
      Alert.alert('Login Failed', err.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>
      <TextInput
        placeholder="Email"
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        placeholder="Password"
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <Button title="Sign In" onPress={handleLogin} />
      <Pressable onPress={() => navigation.navigate('Signup')}>
        <Text style={styles.link}>Don't have an account? Sign up</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, flex: 1, justifyContent: 'center' },
  title: { fontSize: 32, marginBottom: 24, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 12, borderRadius: 6, marginBottom: 12 },
  link: { color: '#007bff', marginTop: 12, textAlign: 'center' },
});
