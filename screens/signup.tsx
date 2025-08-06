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
import { useTheme } from '../utils/theme';
import { SettingsContext, ProviderKey } from '../context/SettingsContext';


const PROVIDERS: { key: ProviderKey; label: string }[] = [
  { key: 'maccabi',  label: 'Maccabi' },
  { key: 'clalit',   label: 'Clalit' },
  { key: 'meuhedet', label: 'Meuhedet' },
  { key: 'leumit',   label: 'Leumit' },
];

export default function SignupScreen({ navigation }: any) {
  const { updateSettings } = useContext(SettingsContext);
  const { colors, typography, backgroundImage } = useTheme();

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
      source={backgroundImage}
      style={[styles.container, { backgroundColor: colors.background }]}
      imageStyle={styles.bgImage}
    >
      <View style={styles.overlay}>
        <Text style={[styles.title, { color: typography.textColor, fontSize: typography.fontSize + 20, fontWeight: typography.fontWeight }]}>Sign Up</Text>

        <TextInput
          placeholder="Full Name"
          placeholderTextColor={colors.textSecondary}
          style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
          value={name}
          onChangeText={setName}
        />

        <Text style={[styles.sectionHeader, { color: typography.textColor, fontSize: typography.fontSize, fontWeight: typography.fontWeight }]}>Select Provider</Text>
        <View style={styles.providers}>
          {PROVIDERS.map(p => (
            <Pressable
              key={p.key}
              style={[
                styles.providerButton,
                { backgroundColor: colors.card, borderColor: provider === p.key ? colors.primary : 'transparent' }
              ]}
              onPress={() => setProvider(p.key)}
            >
              <Text
                style={[
                  styles.providerText,
                  { color: colors.primary, fontWeight: provider === p.key ? typography.fontWeight : '400' }
                ]}
              >
                {p.label}
              </Text>
            </Pressable>
          ))}
        </View>

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

        <TextInput
          placeholder="Confirm Password"
          placeholderTextColor={colors.textSecondary}
          style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
        />

        <Pressable style={[styles.button, { backgroundColor: colors.success }]} onPress={handleSignup}>
          <Text style={[styles.buttonText, { color: colors.card, fontSize: typography.fontSize, fontWeight: typography.fontWeight }]}>Create Account</Text>
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
    marginBottom: 24,
    textAlign: 'center',
  },
  sectionHeader: {
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
    alignItems:      'center',
    borderWidth:     1,
  },
  providerButtonSelected: {
    // Dynamic border color applied inline
  },
  providerText: {
    fontSize: 14,
    // Dynamic color applied inline
  },
  providerTextSelected: {
    fontWeight: '600',
  },
  input: {
    width:             '100%',
    borderRadius:      6,
    padding:           12,
    marginBottom:      12,
    borderWidth:       1,
  },
  button: {
    width:             '100%',
    padding:           12,
    borderRadius:      6,
    alignItems:       'center',
    marginTop:         24,
  },
  buttonText: {
    fontSize:     16,
    fontWeight:   '600',
  },
});
