// src/screens/components/AppointmentHistoryCard.tsx

import React, { useContext } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Colors from '../../styles/Colors';
import { Appointment } from '../../types/appointment';
import { SettingsContext } from '../../context/SettingsContext';

const { width } = Dimensions.get('window');
const CARD_PADDING = 16;

export default function AppointmentHistoryCard({
  appt,
}: {
  appt: Appointment;
}) {
  const { settings } = useContext(SettingsContext);

  // dynamic text styles
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
      : Colors.graydark;

  const dateStr = new Date(appt.slot.startTime).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <View style={styles.card}>
      <Text
        style={[
          styles.doctor,
          { fontSize, fontWeight, color: textColor },
        ]}
      >
        Dr. {appt.doctor.firstName} {appt.doctor.lastName}
      </Text>
      <Text
        style={[
          styles.details,
          { fontSize: fontSize - 2, color: Colors.graydark },
        ]}
      >
        {appt.provider.name} • {appt.slot.branch.name}
      </Text>
      <Text
        style={[
          styles.date,
          { fontSize: fontSize - 2, color: textColor },
        ]}
      >
        {dateStr}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    marginHorizontal: CARD_PADDING,
    marginVertical: 8,
    padding: CARD_PADDING,
    borderRadius: 8,
    shadowColor: '#000',
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
