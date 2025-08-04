// src/screens/signup.tsx
import React, { useState } from 'react';
import {
  View, Text, TextInput, Button, StyleSheet, Alert
} from 'react-native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth }                           from '../firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeModules } from 'react-native';

export default function SignupScreen() {
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
    <View style={styles.container}>
      <Text style={styles.title}>Sign Up</Text>
      <TextInput
        placeholder="Email" style={styles.input}
        value={email} onChangeText={setEmail}
        autoCapitalize="none" keyboardType="email-address"
      />
      <TextInput
        placeholder="Password" style={styles.input}
        value={password} onChangeText={setPassword}
        secureTextEntry
      />
      <TextInput
        placeholder="Confirm Password" style={styles.input}
        value={confirmPassword} onChangeText={setConfirmPassword}
        secureTextEntry
      />
      <Button title="Create Account" onPress={handleSignup} />
    </View>
  );
}

const styles = StyleSheet.create({
  container:{ padding:24, flex:1, justifyContent:'center' },
  title:    { fontSize:32, marginBottom:24, textAlign:'center' },
  input:    { borderWidth:1, borderColor:'#ccc', padding:12, borderRadius:6, marginBottom:12 }
});
