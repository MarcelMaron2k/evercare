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
  Alert,
  NativeModules,
} from 'react-native';
import { SettingsContext } from '../context/SettingsContext';
import { useTheme } from '../utils/theme';
import { collection, doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

const { width } = Dimensions.get('window');
const logo       = require('../assets/logo.png');

export default function UserSettingsScreen() {
  const { settings, updateSettings } = useContext(SettingsContext);
  const { colors, typography, backgroundImage } = useTheme();
  const [displayName, setDisplayName] = useState(settings.name);
  const [email, setEmail] = useState(''); // you can wire this elsewhere
  const [caretakerPhone, setCaretakerPhone] = useState('');
  const [caretakerName, setCaretakerName] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  // sync if context changes
  useEffect(() => {
    setDisplayName(settings.name);
    loadCaretakerSettings();
  }, [settings.name]);

  const loadCaretakerSettings = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      const userDoc = doc(db, 'users', currentUser.uid);
      const docSnap = await getDoc(userDoc);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.caretaker) {
          setCaretakerPhone(data.caretaker.phone || '');
          setCaretakerName(data.caretaker.name || '');
        }
      }
    } catch (error) {
      console.error('Error loading caretaker settings:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // Save display name
      updateSettings({ name: displayName });

      // Save caretaker info if provided
      if (caretakerPhone.trim()) {
        await saveCaretakerSettings();
      }

      Alert.alert('Success', 'Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      Alert.alert('Error', 'Failed to save some settings');
    } finally {
      setLoading(false);
    }
  };

  const saveCaretakerSettings = async () => {
    if (!caretakerPhone.trim()) {
      return; // Skip if no phone number
    }

    // Basic phone number validation
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    if (!phoneRegex.test(caretakerPhone.replace(/\s/g, ''))) {
      Alert.alert('Error', 'Please enter a valid phone number');
      throw new Error('Invalid phone number');
    }

    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    const userDoc = doc(db, 'users', currentUser.uid);
    await setDoc(userDoc, {
      caretaker: {
        name: caretakerName.trim(),
        phone: caretakerPhone.trim(),
        updatedAt: new Date(),
      }
    }, { merge: true });

    // Refresh the caretaker settings in the background service
    const { SettingsModule } = NativeModules;
    if (SettingsModule) {
      try {
        await SettingsModule.refreshCaretakerSettings(caretakerPhone.trim(), caretakerName.trim());
      } catch (error) {
        console.error('Error refreshing caretaker settings:', error);
      }
    }
  };

  const clearCaretakerSettings = () => {
    Alert.alert(
      'Clear Caretaker Information',
      'Are you sure you want to remove the caretaker information? Emergency services (101) will be used for fall alerts.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              const currentUser = auth.currentUser;
              if (!currentUser) return;

              const userDoc = doc(db, 'users', currentUser.uid);
              await setDoc(userDoc, {
                caretaker: null,
                updatedAt: new Date(),
              }, { merge: true });

              // Refresh the caretaker settings in the background service
              const { SettingsModule } = NativeModules;
              if (SettingsModule) {
                try {
                  await SettingsModule.refreshCaretakerSettings(null, null);
                } catch (error) {
                  console.error('Error clearing caretaker settings:', error);
                }
              }

              setCaretakerPhone('');
              setCaretakerName('');
              Alert.alert('Success', 'Caretaker information cleared');
            } catch (error) {
              console.error('Error clearing settings:', error);
              Alert.alert('Error', 'Failed to clear caretaker settings');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ImageBackground
        source={backgroundImage}
        style={styles.background}
        imageStyle={styles.bgImage}
      >
        {/* Header */}
        <View style={styles.header}>
          <Image source={logo} style={styles.logoTop} />
          <Text
            style={[
              styles.appName,
              { fontSize: 28, fontWeight: '600', color: typography.textColor },
            ]}
          >
            EverCare
          </Text>
          <Text
            style={[
              styles.pageTitle,
              { fontSize: 24, fontWeight: typography.fontWeight, color: typography.textColor },
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
                { fontSize: typography.fontSize, fontWeight: typography.fontWeight, color: typography.textColor },
              ]}
            >
              Display Name
            </Text>
            <TextInput
              style={[styles.input, { fontSize: typography.fontSize, color: colors.text, backgroundColor: colors.card, borderColor: colors.border }]}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Enter name"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          {/* Email */}
          <View style={styles.inputGroup}>
            <Text
              style={[
                styles.label,
                { fontSize: typography.fontSize, fontWeight: typography.fontWeight, color: typography.textColor },
              ]}
            >
              Email
            </Text>
            <TextInput
              style={[styles.input, { fontSize: typography.fontSize, color: colors.text, backgroundColor: colors.card, borderColor: colors.border }]}
              value={email}
              onChangeText={setEmail}
              placeholder="Enter email"
              placeholderTextColor={colors.textSecondary}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          {/* Emergency Contact Section */}
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <Text
              style={[
                styles.sectionTitle,
                { fontSize: typography.fontSize + 2, fontWeight: typography.fontWeight, color: typography.textColor },
              ]}
            >
              Emergency Contact
            </Text>
            <Text style={[styles.description, { color: colors.textSecondary }]}>
              Add a caretaker's phone number to be contacted instead of emergency services (101) when a fall is detected.
            </Text>

            <View style={styles.inputGroup}>
              <Text
                style={[
                  styles.label,
                  { fontSize: typography.fontSize, fontWeight: typography.fontWeight, color: typography.textColor },
                ]}
              >
                Caretaker Name (Optional)
              </Text>
              <TextInput
                style={[styles.input, { fontSize: typography.fontSize, color: colors.text, backgroundColor: colors.background, borderColor: colors.border }]}
                value={caretakerName}
                onChangeText={setCaretakerName}
                placeholder="Enter caretaker's name"
                placeholderTextColor={colors.textSecondary}
                maxLength={50}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text
                style={[
                  styles.label,
                  { fontSize: typography.fontSize, fontWeight: typography.fontWeight, color: typography.textColor },
                ]}
              >
                Caretaker Phone Number
              </Text>
              <TextInput
                style={[styles.input, { fontSize: typography.fontSize, color: colors.text, backgroundColor: colors.background, borderColor: colors.border }]}
                value={caretakerPhone}
                onChangeText={setCaretakerPhone}
                placeholder="Enter number (+972501234567)"
                placeholderTextColor={colors.textSecondary}
                keyboardType="phone-pad"
                maxLength={20}
              />
            </View>

            {(caretakerPhone || caretakerName) && (
              <Pressable
                style={[styles.clearButton, { borderColor: colors.destructive }]}
                onPress={clearCaretakerSettings}
                disabled={loading}
              >
                <Text style={[styles.clearButtonText, { color: colors.destructive }]}>
                  Clear Caretaker Information
                </Text>
              </Pressable>
            )}
          </View>

          <Pressable 
            style={[
              styles.button, 
              { backgroundColor: colors.success },
              loading && styles.disabledButton
            ]} 
            onPress={handleSave}
            disabled={loading}
          >
            <Text
              style={[
                styles.buttonText,
                { fontSize: typography.fontSize, fontWeight: typography.fontWeight, color: colors.card },
              ]}
            >
              {loading ? 'Saving...' : 'Save Changes'}
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
    borderRadius:      6,
    padding:           12,
    borderWidth:       1,
  },
  button: {
    width:           '100%',
    padding:         12,
    borderRadius:    6,
    alignItems:      'center',
    marginTop:       24,
  },
  buttonText: {},
  section: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  sectionTitle: {
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  clearButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
    borderWidth: 1,
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  disabledButton: {
    opacity: 0.6,
  },
});
