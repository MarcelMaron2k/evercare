// src/screens/signup.tsx
import React, { useState } from 'react';
import {
  View, Text, TextInput, Button, StyleSheet, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth }                           from '../firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeModules } from 'react-native';
import { useTheme } from '../utils/theme';

export default function SignupScreen() {
  const { colors } = useTheme();
  const [email,           setEmail]           = useState('');
  const [password,        setPassword]        = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

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

  const handleSignup = async () => {
    if (password !== confirmPassword) {
      return Alert.alert('Passwords do not match');
    }
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      // Store user ID for background service access
      await storeUserIdNatively(userCredential.user.uid);
      Alert.alert('Account created!', 'You can now log in.');
      // No navigation.replace('Login') here
    } catch (err: any) {
      Alert.alert('Signup Failed', err.message);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>Sign Up</Text>
      <TextInput
        placeholder="Email" 
        placeholderTextColor={colors.textSecondary}
        style={[styles.input, { 
          borderColor: colors.border, 
          backgroundColor: colors.card,
          color: colors.text 
        }]}
        value={email} onChangeText={setEmail}
        autoCapitalize="none" keyboardType="email-address"
      />
      <TextInput
        placeholder="Password" 
        placeholderTextColor={colors.textSecondary}
        style={[styles.input, { 
          borderColor: colors.border, 
          backgroundColor: colors.card,
          color: colors.text 
        }]}
        value={password} onChangeText={setPassword}
        secureTextEntry
      />
      <TextInput
        placeholder="Confirm Password" 
        placeholderTextColor={colors.textSecondary}
        style={[styles.input, { 
          borderColor: colors.border, 
          backgroundColor: colors.card,
          color: colors.text 
        }]}
        value={confirmPassword} onChangeText={setConfirmPassword}
        secureTextEntry
      />
      <Button title="Create Account" onPress={handleSignup} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:{ padding:24, flex:1, justifyContent:'center' },
  title:    { fontSize:32, marginBottom:24, textAlign:'center' },
  input:    { borderWidth:1, padding:12, borderRadius:6, marginBottom:12 }
});
