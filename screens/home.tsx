// src/screens/Home.tsx

import React, { useContext } from 'react';
import {
  SafeAreaView,
  ImageBackground,
  View,
  Text,
  FlatList,
  StyleSheet,
  Dimensions,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import Colors from '../styles/Colors';
import ActionCard from './components/ActionCard';
import { SettingsContext } from '../context/SettingsContext';

const background = require('../assets/background.png');
const logo       = require('../assets/logo.png');
const { width }  = Dimensions.get('window');

type RootStackParamList = {
  Splash:             undefined;
  Login:              undefined;
  Signup:             undefined;
  Home:               undefined;
  AppointmentCenter:  undefined;
  Medications:        undefined;
  ReportZone:         undefined;
  UserSettings:       undefined;
  AppSettings:        undefined;
  Support:            undefined;
};

type HomeNavProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

interface Action {
  key:      string;
  icon:     string;
  title:    string;
  subtitle: string;
  onPress:  () => void;
}

export default function HomeScreen() {
  const navigation = useNavigation<HomeNavProp>();
  const { settings } = useContext(SettingsContext);

  // compute dynamic styles from settings
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
      : Colors.green;
  const bgColor    = settings.darkMode ? '#111' : Colors.white;

  // greeting logic
  const hour = new Date().getHours();
  const greetingText =
    hour < 12 ? 'Good morning'
      : hour < 18 ? 'Good afternoon'
      : 'Good evening';

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigation.replace('Login');
    } catch (err) {
      console.error('Logout error', err);
    }
  };

  const ACTIONS: Action[] = [
    {
      key: 'appointments',
      icon: '📅',
      title: 'Appointments',
      subtitle: 'View all',
      onPress: () => navigation.navigate('AppointmentCenter'),
    },
    {
      key: 'medications',
      icon: '💊',
      title: 'Medications',
      subtitle: 'Manage meds',
      onPress: () => navigation.navigate('Medications'),
    },
    {
      key: 'reports',
      icon: '📊',
      title: 'Report Zone',
      subtitle: 'View & report',
      onPress: () => navigation.navigate('ReportZone'),
    },
    {
      key: 'userSettings',
      icon: '⚙️',
      title: 'User Settings',
      subtitle: 'Profile',
      onPress: () => navigation.navigate('UserSettings'),
    },
    {
      key: 'appSettings',
      icon: '⚙️',
      title: 'App Settings',
      subtitle: 'Preferences',
      onPress: () => navigation.navigate('AppSettings'),
    },
    {
      key: 'support',
      icon: '📞',
      title: 'Support',
      subtitle: 'Get help',
      onPress: () => navigation.navigate('Support'),
    },
    {
      key: 'logout',
      icon: '🔓',
      title: 'Logout',
      subtitle: 'Sign out',
      onPress: handleLogout,
    },
  ];

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
          <Text style={[styles.appName, { fontSize: 28, fontWeight: '600', color: textColor }]}>
            EverCare
          </Text>
        </View>

        {/* Greeting & Summary */}
        <View style={styles.greetingSection}>
          <Text style={[styles.greeting, { fontSize, fontWeight, color: textColor }]}>
            {greetingText}, {settings.name || 'there'} 👋
          </Text>
          <View style={styles.summaryCard}>
            <Text style={[styles.summaryTitle, { fontSize: fontSize - 2, fontWeight: '600' }]}>
              Next appointment
            </Text>
            <Text style={[styles.summaryText, { fontSize: fontSize - 4, color: Colors.gray }]}>
              No upcoming appointment
            </Text>
          </View>
        </View>

        {/* Action Grid */}
        <FlatList
          data={ACTIONS}
          keyExtractor={item => item.key}
          numColumns={2}
          contentContainerStyle={styles.actionsList}
          renderItem={({ item }) => (
            <ActionCard
              icon={item.icon}
              title={item.title}
              subtitle={item.subtitle}
              onPress={item.onPress}
            />
          )}
        />
      </ImageBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:            { flex: 1 },
  background:      { flex: 1 },
  bgImage:         { opacity: 0.6, resizeMode: 'cover' },
  header:          { alignItems: 'center', paddingVertical: 24 },
  logoTop:         { width: 64, height: 64, resizeMode: 'contain', marginBottom: 8 },
  appName:         { /* base styles overwritten inline */ },
  greetingSection: { paddingHorizontal: 16, marginBottom: 24 },
  greeting:        { textAlign: 'center', marginBottom: 16 },
  summaryCard:     {
    backgroundColor: Colors.white,
    borderRadius:    8,
    padding:         16,
    shadowColor:     '#000',
    shadowOpacity:   0.05,
    shadowRadius:    6,
    shadowOffset:    { width: 0, height: 2 },
    elevation:       2,
    marginBottom:    24,
  },
  summaryTitle:    { color: Colors.blue, marginBottom: 4 },
  summaryText:     { color: '#333' },
  actionsList:     {
    paddingHorizontal: 16,
    paddingBottom:     32,
    justifyContent:    'space-between',
  },
});
