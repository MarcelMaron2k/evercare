// src/screens/UpcomingAppointments.tsx

import React, { useState, useEffect, useCallback, useContext } from 'react';
import {
  SafeAreaView,
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
} from '../services/appointment/appointmentService';
import type { Appointment } from '../types/appointment';
import { SettingsContext } from '../context/SettingsContext';
import { useTheme } from '../utils/theme';

type Props = NativeStackScreenProps<AppStackParamList, 'UpcomingAppointments'>;

interface AppointmentRowProps {
  appt: Appointment;
  onCancel: (slotId: string) => void;
}

const FONT_SIZES = { small: 14, medium: 16, large: 18, xlarge: 20 };

const AppointmentRow: React.FC<AppointmentRowProps> = ({ appt, onCancel }) => {
  const { settings } = useContext(SettingsContext);
  const { colors, typography } = useTheme();

  const timeString = new Date(appt.slot.startTime).toLocaleString([], {
    month:  'short',
    day:    'numeric',
    hour:   '2-digit',
    minute: '2-digit',
  });

  return (
    <View style={[styles.row, { borderColor: colors.separator }]}>
      <Text style={[styles.rowText, { fontSize: typography.fontSize, fontWeight: typography.fontWeight, color: typography.textColor }]}>
        {timeString} — Dr. {appt.doctor.firstName} {appt.doctor.lastName} @ {appt.provider.name}
      </Text>
      <TouchableOpacity
        style={[styles.cancelButton, { backgroundColor: colors.danger }]}
        onPress={() => onCancel(appt.slot.slotId)}
      >
        <Text style={[styles.cancelButtonText, { fontSize: typography.fontSize, fontWeight: typography.fontWeight, color: colors.card }]}>
          Cancel
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default function UpcomingAppointments({ navigation }: Props) {
  const { settings } = useContext(SettingsContext);
  const { colors, typography } = useTheme();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const loadAppointments = useCallback(async () => {
    setLoading(true);
    const all = await getBookedAppointments();
    const now = new Date().toISOString();
    const upcoming = all
      .filter(a => a.slot.startTime > now)
      .sort((a, b) =>
        a.slot.startTime.localeCompare(b.slot.startTime)
      );
    setAppointments(upcoming);
    setLoading(false);
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', loadAppointments);
    return unsubscribe;
  }, [loadAppointments, navigation]);

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
              await removeBookedAppointment(slotId);
              await loadAppointments();
              Alert.alert('Canceled', 'Appointment has been canceled.');
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
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {appointments.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={[
            styles.emptyText,
            {
              fontSize: typography.fontSize,
              color: typography.textColor,
            }
          ]}>
            No upcoming appointments.
          </Text>
        </View>
      ) : (
        <FlatList<Appointment>
          data={appointments}
          keyExtractor={item => item.slot.slotId}
          renderItem={({ item }) => (
            <AppointmentRow appt={item} onCancel={handleCancel} />
          )}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:       { flex: 1 },
  emptyContainer:  { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText:       { },

  listContainer:   { paddingBottom: 16 },

  row: {
    flexDirection:   'row',
    alignItems:      'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  rowText:         { flex: 1 },

  cancelButton:    {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius:    4,
    marginLeft:      12,
  },
  cancelButtonText:{},
});
