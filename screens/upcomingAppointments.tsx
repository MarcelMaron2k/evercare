// src/screens/UpcomingAppointments.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppStackParamList } from '../navigation/AppNavigator';
import {
  getBookedAppointments,
  removeBookedAppointment,
} from '../services/appointmentService';
import type { Appointment } from '../types/appointment';

// Typing for React Navigation params:
type Props = NativeStackScreenProps<AppStackParamList, 'UpcomingAppointments'>;

/**
 * Renders one appointment row with a “Cancel” button
 */
const AppointmentRow: React.FC<{
  appt: Appointment;
  onCancel: (slotId: string) => void;
}> = ({ appt, onCancel }) => {
  const timeString = new Date(appt.slot.startTime).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <View style={styles.row}>
      <View style={styles.rowTextContainer}>
        <Text style={styles.rowText}>
          {timeString} — Dr. {appt.doctor.firstName} {appt.doctor.lastName} @{' '}
          {appt.provider.name}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.cancelButton}
        onPress={() => onCancel(appt.slot.slotId)}
      >
        <Text style={styles.cancelButtonText}>Cancel</Text>
      </TouchableOpacity>
    </View>
  );
};

const UpcomingAppointments: React.FC<Props> = ({ navigation }) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Load all booked appointments, filter to future‐only
  const loadAppointments = useCallback(async () => {
    setLoading(true);
    const all = await getBookedAppointments();
    const now = new Date().toISOString();
    const upcoming = all.filter((a) => a.slot.startTime > now);
    upcoming.sort((a, b) => a.slot.startTime.localeCompare(b.slot.startTime));
    setAppointments(upcoming);
    setLoading(false);
  }, []);

  // Refresh whenever this screen is focused
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadAppointments();
    });
    return unsubscribe;
  }, [loadAppointments, navigation]);

  // Called when user taps “Cancel”
  const handleCancel = useCallback(
    async (slotId: string) => {
      Alert.alert(
        'Confirm Cancellation',
        'Are you sure you want to cancel this appointment?',
        [
          { text: 'No', style: 'cancel' },
          {
            text: 'Yes',
            style: 'destructive',
            onPress: async () => {
              try {
                await removeBookedAppointment(slotId);
                // Reload the list after removal
                await loadAppointments();
                Alert.alert('Canceled', 'Appointment has been canceled.');
              } catch (err) {
                console.error(err);
                Alert.alert(
                  'Error',
                  'There was a problem canceling the appointment.'
                );
              }
            },
          },
        ]
      );
    },
    [loadAppointments]
  );

  if (loading) {
    return <ActivityIndicator style={{ flex: 1, marginTop: 50 }} />;
  }

  return (
    <View style={styles.container}>
      {appointments.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No upcoming appointments.</Text>
        </View>
      ) : (
        <FlatList
          data={appointments}
          keyExtractor={(item: Appointment) => item.slot.slotId}
          renderItem={({ item }) => (
            <AppointmentRow appt={item} onCancel={handleCancel} />
          )}
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  rowTextContainer: {
    flex: 1,
  },
  rowText: {
    fontSize: 16,
  },
  cancelButton: {
    backgroundColor: '#FF3B30',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
    marginLeft: 12,
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default UpcomingAppointments;
