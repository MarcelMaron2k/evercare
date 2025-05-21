// src/screens/login.tsx
import React, { useState } from 'react';
import {
  View, Text, TextInput, Button, StyleSheet, Alert, Pressable
} from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth }                       from '../firebase';

export default function LoginScreen() {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
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
      <Pressable onPress={() => {/* use navigation.navigate('Signup') */}}>
        <Text style={styles.link}>Don't have an account? Sign up</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container:{ padding:24, flex:1, justifyContent:'center' },
  title:    { fontSize:32, marginBottom:24, textAlign:'center' },
  input:    { borderWidth:1, borderColor:'#ccc', padding:12, borderRadius:6, marginBottom:12 },
  link:     { color:'#007bff', marginTop:12, textAlign:'center' }
});
