// src/screens/signup.tsx
import React, { useState, useContext } from 'react';
import {
  ImageBackground,
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
} from 'react-native';
import {
  createUserWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { auth } from '../firebase';
import Colors from '../styles/Colors';
import { SettingsContext, ProviderKey } from '../context/SettingsContext';

const background = require('../assets/background.png');

const PROVIDERS: { key: ProviderKey; label: string }[] = [
  { key: 'maccabi',  label: 'Maccabi' },
  { key: 'clalit',   label: 'Clalit' },
  { key: 'meuhedet', label: 'Meuhedet' },
  { key: 'leumit',   label: 'Leumit' },
];

export default function SignupScreen({ navigation }: any) {
  const { updateSettings } = useContext(SettingsContext);

  const [name, setName]                   = useState('');
  const [email, setEmail]                 = useState('');
  const [password, setPassword]           = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [provider, setProvider]           = useState<ProviderKey>('');

  const handleSignup = async () => {
    // validate
    if (!name.trim() || !provider) {
      Alert.alert('Error', 'Please enter your name and select a provider.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }

    try {
      // create & auto-login
      await createUserWithEmailAndPassword(auth, email, password);
      // persist into context + AsyncStorage
      await updateSettings({ name: name.trim(), provider });
      // immediately sign out so we drop back to AuthNavigator
      await signOut(auth);
      // then go to Login screen
      navigation.navigate('Login');
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
        <Text style={styles.title}>Sign Up</Text>

        <TextInput
          placeholder="Full Name"
          placeholderTextColor="#666"
          style={styles.input}
          value={name}
          onChangeText={setName}
        />

        <Text style={styles.sectionHeader}>Select Provider</Text>
        <View style={styles.providers}>
          {PROVIDERS.map(p => (
            <Pressable
              key={p.key}
              style={[
                styles.providerButton,
                provider === p.key && styles.providerButtonSelected,
              ]}
              onPress={() => setProvider(p.key)}
            >
              <Text
                style={[
                  styles.providerText,
                  provider === p.key && styles.providerTextSelected,
                ]}
              >
                {p.label}
              </Text>
            </Pressable>
          ))}
        </View>

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
  container: { flex: 1 },
  bgImage:   { opacity: 0.6 },
  overlay: {
    flex:            1,
    padding:        24,
    justifyContent: 'center',
  },
  title: {
    fontSize:   36,
    fontWeight: '600',
    color:      Colors.blue,
    marginBottom: 24,
    textAlign: 'center',
  },
  sectionHeader: {
    fontSize:   16,
    fontWeight: '600',
    color:      Colors.blue,
    marginTop:  16,
    marginBottom: 8,
  },
  providers: {
    flexDirection: 'row',
    justifyContent:'space-between',
    marginBottom: 16,
  },
  providerButton: {
    flex:            1,
    marginHorizontal: 4,
    paddingVertical: 12,
    borderRadius:    6,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems:      'center',
    borderWidth:     1,
    borderColor:     'transparent',
  },
  providerButtonSelected: {
    borderColor: Colors.blue,
  },
  providerText: {
    fontSize: 14,
    color:    Colors.blue,
  },
  providerTextSelected: {
    fontWeight: '600',
  },
  input: {
    width:             '100%',
    backgroundColor:  'rgba(255,255,255,0.9)',
    borderRadius:      6,
    padding:           12,
    marginBottom:      12,
    borderWidth:       1,
    borderColor:       '#555',
  },
  button: {
    width:             '100%',
    backgroundColor:   Colors.green,
    padding:           12,
    borderRadius:      6,
    alignItems:       'center',
    marginTop:         24,
  },
  buttonText: {
    color:        Colors.white,
    fontSize:     16,
    fontWeight:   '600',
  },
});
