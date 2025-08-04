// src/screens/signup.tsx
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
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import Colors from '../styles/Colors';

const background = require('../assets/background.png');
const logo       = require('../assets/logo.png');

export default function SignupScreen() {
  const [email, setEmail]                 = useState('');
  const [password, setPassword]           = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSignup = async () => {
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      Alert.alert('Success', 'Account created! You can now log in.');
    } catch (err: any) {
      Alert.alert('Signup Failed', err.message);
    }
  };

  return (
    <ImageBackground
      source={background}
      style={styles.container}
      imageStyle={styles.bgImage}
    >
      <View style={styles.overlay}>
        <Image source={logo} style={styles.logoTop} />
        <Text style={styles.appName}>EverCare</Text>
        <Text style={styles.title}>Sign Up</Text>

        <TextInput
          placeholder="Email"
          placeholderTextColor="#666"
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <TextInput
          placeholder="Password"
          placeholderTextColor="#666"
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TextInput
          placeholder="Confirm Password"
          placeholderTextColor="#666"
          style={styles.input}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
        />

        <Pressable style={styles.button} onPress={handleSignup}>
          <Text style={styles.buttonText}>Create Account</Text>
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
    fontSize: 28,
    fontWeight: '600',
    color: Colors.blue,
    marginBottom: 16,
  },
  title: {
    fontSize: 36,
    fontWeight: '600',
    color: Colors.blue,
    marginBottom: 24,
  },
  input: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 6,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#555',    // dark gray border
  },
  button: {
    width: '100%',
    backgroundColor: Colors.green,
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginVertical: 12,
  },
  buttonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});
