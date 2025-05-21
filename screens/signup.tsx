// src/screens/signup.tsx
import React, { useState } from 'react';
import {
  View, Text, TextInput, Button, StyleSheet, Alert
} from 'react-native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth }                           from '../firebase';

export default function SignupScreen() {
  const [email,           setEmail]           = useState('');
  const [password,        setPassword]        = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSignup = async () => {
    if (password !== confirmPassword) {
      return Alert.alert('Passwords do not match');
    }
    try {
      await createUserWithEmailAndPassword(auth, email, password);
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
