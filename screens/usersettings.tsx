// src/screens/UserSettings.tsx

import React, { useContext, useState, useEffect } from 'react';
import {
  SafeAreaView,
  ImageBackground,
  ScrollView,
  View,
  Text,
  TextInput,
  Pressable,
  Image,
  StyleSheet,
  Dimensions,
} from 'react-native';
import Colors from '../styles/Colors';
import { SettingsContext } from '../context/SettingsContext';

const { width } = Dimensions.get('window');
const background = require('../assets/background.png');
const logo       = require('../assets/logo.png');

export default function UserSettingsScreen() {
  const { settings, updateSettings } = useContext(SettingsContext);
  const [displayName, setDisplayName] = useState(settings.name);
  const [email, setEmail]             = useState(''); // you can wire this elsewhere

  // sync if context changes
  useEffect(() => {
    setDisplayName(settings.name);
  }, [settings.name]);

  // dynamic styles
  const FONT_SIZES: Record<typeof settings.fontSizeKey, number> = {
    small:  14,
    medium: 16,
    large:  18,
    xlarge: 20,
  };
  const fontSize   = FONT_SIZES[settings.fontSizeKey];
  const fontWeight = settings.boldText ? '700' : '400';
  const textColor  = settings.highContrast
    ? '#000'
    : settings.darkMode
      ? Colors.white
      : Colors.blue;
  const bgColor    = settings.darkMode ? Colors.black : Colors.white;

  const handleSave = () => {
    updateSettings({ name: displayName });
    // TODO: persist email to your backend if needed
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: bgColor }]}>
      <ImageBackground
        source={background}
        style={styles.background}
        imageStyle={styles.bgImage}
      >
        {/* Header */}
        <View style={styles.header}>
          <Image source={logo} style={styles.logoTop} />
          <Text
            style={[
              styles.appName,
              { fontSize: 28, fontWeight: '600', color: textColor },
            ]}
          >
            EverCare
          </Text>
          <Text
            style={[
              styles.pageTitle,
              { fontSize: 24, fontWeight, color: textColor },
            ]}
          >
            User Settings
          </Text>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {/* Display Name */}
          <View style={styles.inputGroup}>
            <Text
              style={[
                styles.label,
                { fontSize, fontWeight, color: textColor },
              ]}
            >
              Display Name
            </Text>
            <TextInput
              style={[styles.input, { fontSize, color: textColor }]}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Enter name"
              placeholderTextColor="#666"
            />
          </View>

          {/* Email */}
          <View style={styles.inputGroup}>
            <Text
              style={[
                styles.label,
                { fontSize, fontWeight, color: textColor },
              ]}
            >
              Email
            </Text>
            <TextInput
              style={[styles.input, { fontSize, color: textColor }]}
              value={email}
              onChangeText={setEmail}
              placeholder="Enter email"
              placeholderTextColor="#666"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <Pressable style={styles.button} onPress={handleSave}>
            <Text
              style={[
                styles.buttonText,
                { fontSize, fontWeight },
              ]}
            >
              Save Changes
            </Text>
          </Pressable>
        </ScrollView>
      </ImageBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  background: {
    flex: 1,
    width,
  },
  bgImage: {
    opacity: 0.6,
    resizeMode: 'cover',
  },
  header: {
    alignItems:     'center',
    paddingVertical: 24,
  },
  logoTop: {
    width:        64,
    height:       64,
    resizeMode:   'contain',
    marginBottom: 8,
  },
  appName: {
    marginBottom: 4,
  },
  pageTitle: {
    marginTop: 8,
  },
  content: {
    padding: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 4,
  },
  input: {
    width:             '100%',
    backgroundColor:   'rgba(255,255,255,0.9)',
    borderRadius:      6,
    padding:           12,
    borderWidth:       1,
    borderColor:       '#555',
  },
  button: {
    width:           '100%',
    backgroundColor: Colors.green,
    padding:         12,
    borderRadius:    6,
    alignItems:      'center',
    marginTop:       24,
  },
  buttonText: {
    color:      Colors.white,
  },
});
