// src/screens/Home.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

import { auth, db } from '../firebase';
import { collection, getDocs, query } from 'firebase/firestore';
import { usePermissions } from '../usePermissions';

type TabParamList = {
  Home: undefined;
  Medications: undefined;
};

type NavProp = BottomTabNavigationProp<TabParamList, 'Home'>;

export default function HomeScreen() {
  const navigation = useNavigation<NavProp>();
  const [nextMed, setNextMed] = useState<string | null>(null);
  const userId = auth.currentUser?.uid;

  useEffect(() => {
    const loadMedications = async () => {
      if (!userId) return;

      const medsRef = collection(db, 'users', userId, 'medications');
      const q = query(medsRef);
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        setNextMed(null);
        return;
      }

      // Just show the first one for now
      const meds = snapshot.docs.map(doc => doc.data() as any);
      setNextMed(`${meds[0].name} at ${meds[0].time}`);
    };

    loadMedications();
  }, [userId]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Welcome to EverCare 👋</Text>

      {/* Medication summary */}
      <Pressable
        style={styles.card}
        onPress={() => navigation.navigate('Medications')}
      >
        <Text style={styles.cardTitle}>💊 Medications</Text>
        <Text>
          {nextMed ? `Next: ${nextMed}` : 'No medications set'}
        </Text>
      </Pressable>

      {/* Emergency placeholder */}
      <Pressable style={styles.card} onPress={() => {/* TODO */}}>
        <Text style={styles.cardTitle}>🆘 Emergency</Text>
        <Text>Emergency help tools coming soon</Text>
      </Pressable>

      {/* Appointments placeholder */}
      <Pressable style={styles.card} onPress={() => {/* TODO */}}>
        <Text style={styles.cardTitle}>📅 Appointments</Text>
        <Text>Your upcoming appointments will appear here</Text>
      </Pressable>

      {/* Vitals placeholder */}
      <Pressable style={styles.card} onPress={() => {/* TODO */}}>
        <Text style={styles.cardTitle}>❤️ Vitals</Text>
        <Text>Heart rate and step count support coming</Text>
      </Pressable>

      {/* Settings placeholder */}
      <Pressable style={styles.card} onPress={() => {/* TODO */}}>
        <Text style={styles.cardTitle}>⚙️ Settings</Text>
        <Text>Language, font size, and more</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    gap: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#f2f2f2',
    padding: 16,
    borderRadius: 10,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 6,
  },
});
