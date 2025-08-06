// src/screens/components/AppointmentHistoryCard.tsx

import React, { useContext } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Appointment } from '../../types/appointment';
import { SettingsContext } from '../../context/SettingsContext';
import { useTheme } from '../../utils/theme';

const { width } = Dimensions.get('window');
const CARD_PADDING = 16;

export default function AppointmentHistoryCard({
  appt,
}: {
  appt: Appointment;
}) {
  const { settings } = useContext(SettingsContext);
  const { colors, typography } = useTheme();

  const dateStr = new Date(appt.slot.startTime).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <View style={[styles.card, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
      <Text
        style={[
          styles.doctor,
          { fontSize: typography.fontSize, fontWeight: typography.fontWeight, color: typography.textColor },
        ]}
      >
        Dr. {appt.doctor.firstName} {appt.doctor.lastName}
      </Text>
      <Text
        style={[
          styles.details,
          { fontSize: typography.fontSize - 2, color: colors.textSecondary },
        ]}
      >
        {appt.provider.name} • {appt.slot.branch.name}
      </Text>
      <Text
        style={[
          styles.date,
          { fontSize: typography.fontSize - 2, color: typography.textColor },
        ]}
      >
        {dateStr}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: CARD_PADDING,
    marginVertical: 8,
    padding: CARD_PADDING,
    borderRadius: 8,
    shadowOpacity: 0.03,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  doctor: {
    marginBottom: 4,
  },
  details: {
    marginBottom: 6,
  },
  date: {},
});
