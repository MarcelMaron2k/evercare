import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, TextInput, Pressable, ScrollView, Alert, View, NativeModules } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AppStackParamList } from '../navigation/AppNavigator';
import { collection, doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { useTheme } from '../utils/theme';

type SettingsNavProp = NativeStackNavigationProp<AppStackParamList, 'Settings'>;

const SettingsScreen: React.FC = () => {
  const navigation = useNavigation<SettingsNavProp>();
  const { colors } = useTheme();
  const [caretakerPhone, setCaretakerPhone] = useState('');
  const [caretakerName, setCaretakerName] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
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
      console.error('Error loading settings:', error);
      Alert.alert('Error', 'Failed to load settings');
    } finally {
      setLoadingData(false);
    }
  };

  const saveSettings = async () => {
    console.log('=== saveSettings called ===');
    console.log('caretakerPhone:', caretakerPhone);
    console.log('caretakerName:', caretakerName);
    
    if (!caretakerPhone.trim()) {
      Alert.alert('Error', 'Please enter a caretaker phone number');
      return;
    }

    // Basic phone number validation
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    if (!phoneRegex.test(caretakerPhone.replace(/\s/g, ''))) {
      Alert.alert('Error', 'Please enter a valid phone number');
      return;
    }

    setLoading(true);
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        Alert.alert('Error', 'You must be logged in to save settings');
        return;
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
      console.log('SettingsModule available:', !!SettingsModule);
      console.log('About to call refreshCaretakerSettings with phone:', caretakerPhone.trim());
      
      if (SettingsModule) {
        try {
          const result = await SettingsModule.refreshCaretakerSettings(caretakerPhone.trim(), caretakerName.trim());
          console.log('Caretaker settings refreshed in background service, result:', result);
        } catch (error) {
          console.error('Error refreshing caretaker settings:', error);
        }
      } else {
        console.error('SettingsModule is not available!');
      }

      Alert.alert('Success', 'Caretaker information saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      Alert.alert('Error', 'Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const clearSettings = () => {
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
              console.log('Clearing caretaker settings, SettingsModule available:', !!SettingsModule);
              
              if (SettingsModule) {
                try {
                  const result = await SettingsModule.refreshCaretakerSettings(null, null);
                  console.log('Caretaker settings cleared in background service, result:', result);
                } catch (error) {
                  console.error('Error clearing caretaker settings:', error);
                }
              } else {
                console.error('SettingsModule is not available for clearing!');
              }

              setCaretakerPhone('');
              setCaretakerName('');
              Alert.alert('Success', 'Caretaker information cleared');
            } catch (error) {
              console.error('Error clearing settings:', error);
              Alert.alert('Error', 'Failed to clear settings');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  if (loadingData) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.text }]}>Loading settings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.container}>
        <Pressable
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={[styles.backButtonText, { color: colors.primary }]}>← Back</Text>
        </Pressable>

        <Text style={[styles.title, { color: colors.text }]}>Settings</Text>

        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Emergency Contact</Text>
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            Add a caretaker's phone number to be contacted instead of emergency services (101) when a fall is detected.
          </Text>

          <Text style={[styles.label, { color: colors.text }]}>Caretaker Name (Optional)</Text>
          <TextInput
            style={[styles.input, { 
              backgroundColor: colors.background, 
              borderColor: colors.border,
              color: colors.text 
            }]}
            value={caretakerName}
            onChangeText={setCaretakerName}
            placeholder="Enter caretaker's name"
            placeholderTextColor={colors.textSecondary}
            maxLength={50}
          />

          <Text style={[styles.label, { color: colors.text }]}>Caretaker Phone Number *</Text>
          <TextInput
            style={[styles.input, { 
              backgroundColor: colors.background, 
              borderColor: colors.border,
              color: colors.text 
            }]}
            value={caretakerPhone}
            onChangeText={setCaretakerPhone}
            placeholder="Enter number (+972501234567)"
            placeholderTextColor={colors.textSecondary}
            keyboardType="phone-pad"
            maxLength={20}
          />

          <Pressable
            style={[
              styles.saveButton, 
              { backgroundColor: colors.primary },
              loading && styles.disabledButton
            ]}
            onPress={saveSettings}
            disabled={loading}
          >
            <Text style={styles.saveButtonText}>
              {loading ? 'Saving...' : 'Save Settings'}
            </Text>
          </Pressable>

          {(caretakerPhone || caretakerName) && (
            <Pressable
              style={[styles.clearButton, loading && styles.disabledButton]}
              onPress={clearSettings}
              disabled={loading}
            >
              <Text style={[styles.clearButtonText, { color: colors.destructive }]}>
                Clear Caretaker Information
              </Text>
            </Pressable>
          )}
        </View>

        <View style={[styles.infoSection, { backgroundColor: colors.card }]}>
          <Text style={[styles.infoTitle, { color: colors.text }]}>How it works</Text>
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            • When a fall is detected, the app will attempt to call your caretaker first
          </Text>
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            • If no caretaker is set, emergency services (101) will be called
          </Text>
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            • Make sure your caretaker's phone number is correct and includes country code if needed
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  container: {
    padding: 16,
    alignItems: 'stretch',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 16,
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 24,
    textAlign: 'center',
  },
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
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  saveButton: {
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  clearButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#ff6b6b',
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  disabledButton: {
    opacity: 0.6,
  },
  infoSection: {
    padding: 16,
    borderRadius: 12,
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    marginBottom: 4,
    lineHeight: 20,
  },
});

export default SettingsScreen;