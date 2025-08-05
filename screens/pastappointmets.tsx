// src/screens/PastAppointments.tsx

import React, { useState, useEffect, useCallback, useContext } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  ActivityIndicator,
  FlatList,
  StyleSheet,
  ImageBackground,
  Dimensions,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppStackParamList } from '../navigation/AppNavigator';
import {
  getBookedAppointments,
} from '../services/appointment/appointmentService';
import type { Appointment } from '../types/appointment';
import AppointmentHistoryCard from './components/AppointmentHistoryCard';
import Colors from '../styles/Colors';
import { SettingsContext } from '../context/SettingsContext'
const background = require('../assets/background.png');
const { width, height } = Dimensions.get('window');

type Props = NativeStackScreenProps<AppStackParamList, 'PastAppointments'>;

export default function PastAppointments({ navigation }: Props) {
  const { settings } = useContext(SettingsContext);
  const FONT_SIZES: Record<typeof settings.fontSizeKey, number> = {
    small: 14,
    medium: 16,
    large: 18,
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

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const loadAppointments = useCallback(async () => {
    setLoading(true);
    const all = await getBookedAppointments();
    const now = new Date().toISOString();
    const past = all
      .filter(a => a.slot.startTime < now)
      .sort((a, b) => b.slot.startTime.localeCompare(a.slot.startTime));
    setAppointments(past);
    setLoading(false);
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', loadAppointments);
    return unsubscribe;
  }, [loadAppointments, navigation]);

  if (loading) {
    return <ActivityIndicator style={{ flex: 1, marginTop: 50 }} />;
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: bgColor }]}>
      <ImageBackground
        source={background}
        style={styles.background}
        imageStyle={styles.bgImage}
      >
        <Text style={[styles.pageTitle, { fontSize: 24, fontWeight: '600', color: textColor }]}>
          Past Appointments
        </Text>
        {appointments.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { fontSize, color: textColor }]}>
              No past appointments.
            </Text>
          </View>
        ) : (
          <FlatList
            data={appointments}
            keyExtractor={a => a.slot.slotId}
            renderItem={({ item }) => <AppointmentHistoryCard appt={item} />}
            contentContainerStyle={styles.listContainer}
          />
        )}
      </ImageBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  background: { flex: 1, width, height },
  bgImage: { opacity: 0.6, resizeMode: 'cover' },

  pageTitle: { margin: 16 },

  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: {},

  listContainer: { paddingBottom: 16 },
});
