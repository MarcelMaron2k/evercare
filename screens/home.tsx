import React from 'react';
import { StyleSheet, Pressable, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AppStackParamList } from '../navigation/AppNavigator';

type HomeNavProp = NativeStackNavigationProp<AppStackParamList, 'Home'>;

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeNavProp>();

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Welcome to EverCare 👋</Text>

        <Pressable
          style={styles.card}
          onPress={() => navigation.navigate('AppointmentCenter')}
        >
          <Text style={styles.cardTitle}>📅 Appointments</Text>
          <Text>Your upcoming appointments will appear here</Text>
        </Pressable>

        <Pressable
          style={styles.card}
          onPress={() => navigation.navigate('Medications')}
        >
          <Text style={styles.cardTitle}>💊 Medications</Text>
          <Text>Manage your medication schedule</Text>
        </Pressable>

        <Pressable
          style={styles.card}
        
        >
          <Text style={styles.cardTitle}>📊 Report Zone</Text>
          <Text>View and report zones</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#f9f9f9',
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
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    // Basic shadow for iOS
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    // Elevation for Android
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 4,
  },
});

export default HomeScreen;