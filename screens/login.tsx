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
import Colors from '../styles/Colors';

const background = require('../assets/background.png');
const logo       = require('../assets/logo.png');

type LoginNavProp = NativeStackNavigationProp<AuthStackParamList, 'Login'>;
interface Props { navigation: LoginNavProp; }

export default function LoginScreen({ navigation }: Props) {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      Alert.alert('Login Failed', err.message);
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
        <Text style={styles.title}>Login</Text>

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

        <Pressable style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>Sign In</Text>
        </Pressable>

        <Pressable onPress={() => navigation.navigate('Signup')}>
          <Text style={styles.link}>Don't have an account? Sign up</Text>
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
  link: {
    color: Colors.blue,
    marginTop: 12,
  },
});
