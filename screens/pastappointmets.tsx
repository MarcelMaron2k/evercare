// src/screens/PastAppointments.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
  FlatList,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppStackParamList } from '../navigation/AppNavigator';
import { getBookedAppointments } from '../services/appointmentService';
import type { Appointment, Slot } from '../types/appointment';

type Props = NativeStackScreenProps<AppStackParamList, 'PastAppointments'>;

/**
 * Renders a simple appointment row
 */
const AppointmentRow: React.FC<{ appt: Appointment }> = ({ appt }) => {
  const timeString = new Date(appt.slot.startTime).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  return (
    <View style={styles.row}>
      <Text style={styles.rowText}>
        {timeString} — Dr. {appt.doctor.firstName} {appt.doctor.lastName} @ {appt.provider.name}
      </Text>
    </View>
  );
};

const PastAppointments: React.FC<Props> = ({ navigation }) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Fetch all booked appointments and filter to past only
  const loadAppointments = useCallback(async () => {
    setLoading(true);
    const all = await getBookedAppointments();
    const now = new Date().toISOString();
    const past = all.filter((a) => a.slot.startTime < now);
    // Sort by startTime descending (most recent first)
    past.sort((a, b) => b.slot.startTime.localeCompare(a.slot.startTime));
    setAppointments(past);
    setLoading(false);
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadAppointments();
    });
    return unsubscribe;
  }, [loadAppointments, navigation]);

  if (loading) {
    return <ActivityIndicator style={{ flex: 1, marginTop: 50 }} />;
  }

  return (
    <View style={styles.container}>
      {appointments.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No past appointments.</Text>
        </View>
      ) : (
        <FlatList
          data={appointments}
          keyExtractor={(item: Appointment) => item.slot.slotId}
          renderItem={({ item }) => <AppointmentRow appt={item} />}
          contentContainerStyle={{ paddingBottom: 16 }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
  },
  row: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  rowText: {
    fontSize: 16,
  },
});

export default PastAppointments;
