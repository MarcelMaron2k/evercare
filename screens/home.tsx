import React from 'react';
import { StyleSheet, Pressable, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AppStackParamList } from '../navigation/AppNavigator';

import { auth, db } from '../firebase';
import { collection, getDocs, query } from 'firebase/firestore';
import { usePermissions } from '../usePermissions';
import { useTheme } from '../utils/theme';

type HomeNavProp = NativeStackNavigationProp<AppStackParamList, 'Home'>;

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeNavProp>();
  const { colors } = useTheme();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={[styles.title, { color: colors.text }]}>Welcome to EverCare 👋</Text>

        <Pressable
          style={[styles.card, { backgroundColor: colors.card }]}
          onPress={() => navigation.navigate('AppointmentCenter')}
        >
          <Text style={[styles.cardTitle, { color: colors.text }]}>📅 Appointments</Text>
          <Text style={{ color: colors.textSecondary }}>Your upcoming appointments will appear here</Text>
        </Pressable>

        <Pressable
          style={[styles.card, { backgroundColor: colors.card }]}
          onPress={() => navigation.navigate('Medications')}
        >
          <Text style={[styles.cardTitle, { color: colors.text }]}>💊 Medications</Text>
          <Text style={{ color: colors.textSecondary }}>Manage your medication schedule</Text>
        </Pressable>

        <Pressable
          style={[styles.card, { backgroundColor: colors.card }]}
        >
          <Text style={[styles.cardTitle, { color: colors.text }]}>📊 Report Zone</Text>
          <Text style={{ color: colors.textSecondary }}>View and report zones</Text>
        </Pressable>
        <Pressable
          style={[styles.card, { backgroundColor: colors.card }]}
          onPress={() => navigation.navigate('History')}
        >
          <Text style={[styles.cardTitle, { color: colors.text }]}>📊 Fall History</Text>
          <Text style={{ color: colors.textSecondary }}>View your most recent falls</Text>
        </Pressable>
        
        <Pressable
          style={[styles.card, { backgroundColor: colors.card }]}
          onPress={() => navigation.navigate('Settings')}
        >
          <Text style={[styles.cardTitle, { color: colors.text }]}>⚙️ Settings</Text>
          <Text style={{ color: colors.textSecondary }}>Configure emergency contacts and app preferences</Text>
        </Pressable>
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
  title: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },
  card: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 4,
  },
});

export default HomeScreen;