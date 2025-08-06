// src/screens/Home.tsx

import React from 'react';
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
import ActionCard from './components/ActionCard';
import { useTheme } from '../utils/theme';

const logo = require('../assets/logo.png');
const { width } = Dimensions.get('window');

type RootStackParamList = {
  Splash:             undefined;
  Login:              undefined;
  Signup:             undefined;
  Home:               undefined;
  AppointmentCenter:  undefined;
  Medications:        undefined;
  History:            undefined;
  UserSettings:       undefined;
  AppSettings:        undefined;
  SupportScreen:      undefined;
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
  const { colors, typography, backgroundImage, settings } = useTheme();

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
      key: 'history',
      icon: '📋',
      title: 'Fall History',
      subtitle: 'View falls',
      onPress: () => navigation.navigate('History'),
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
      onPress: () => navigation.navigate('SupportScreen'),
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
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ImageBackground
        source={backgroundImage}
        style={styles.background}
        imageStyle={styles.bgImage}
      >
        {/* Header */}
        <View style={styles.header}>
          <Image source={logo} style={styles.logoTop} />
          <Text style={[styles.appName, { fontSize: 28, fontWeight: '600', color: typography.textColor }]}>
            EverCare
          </Text>
        </View>

        {/* Greeting & Summary */}
        <View style={styles.greetingSection}>
          <Text style={[styles.greeting, { fontSize: typography.fontSize, fontWeight: typography.fontWeight, color: typography.textColor }]}>
            {greetingText}, {settings.name || 'there'} 👋
          </Text>
          <View style={[styles.summaryCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.summaryTitle, { fontSize: typography.fontSize - 2, fontWeight: '600', color: colors.primary }]}>
              Next appointment
            </Text>
            <Text style={[styles.summaryText, { fontSize: typography.fontSize - 4, color: colors.textSecondary }]}>
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
    borderRadius:    8,
    padding:         16,
    shadowColor:     '#000',
    shadowOpacity:   0.05,
    shadowRadius:    6,
    shadowOffset:    { width: 0, height: 2 },
    elevation:       2,
    marginBottom:    24,
  },
  summaryTitle:    { marginBottom: 4 },
  summaryText:     { },
  actionsList:     {
    paddingHorizontal: 16,
    paddingBottom:     32,
    justifyContent:    'space-between',
  },
});
