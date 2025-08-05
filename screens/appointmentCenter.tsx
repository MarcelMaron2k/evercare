// src/screens/AppointmentCenter.tsx

import React, { useContext, useEffect, useState, useCallback } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  Dimensions,
  ImageBackground,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Colors from '../styles/Colors';
import { SettingsContext } from '../context/SettingsContext';
import {
  getBookedAppointments,
  removeBookedAppointment,
} from '../services/appointment/appointmentService';
import type { Appointment } from '../types/appointment';

const background = require('../assets/background.png');
const { width } = Dimensions.get('window');
const CARD_PADDING = 16;

type RootStackParamList = {
  AddAppointment: undefined;
  AppointmentCenter: undefined;
  PastAppointments: undefined;
};

type NavProp = NativeStackNavigationProp<RootStackParamList, 'AppointmentCenter'>;

export default function AppointmentCenter() {
  const navigation = useNavigation<NavProp>();
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

  const [booked, setBooked] = useState<Appointment[]>([]);

  const loadBooked = useCallback(async () => {
    if (!settings.provider) {
      setBooked([]);
      return;
    }
    const all = await getBookedAppointments();
    const upcoming = all
      .filter(a => a.provider.id === settings.provider)
      .filter(a => new Date(a.slot.startTime) > new Date())
      .sort((a, b) => new Date(a.slot.startTime).getTime() - new Date(b.slot.startTime).getTime());
    setBooked(upcoming);
  }, [settings.provider]);

  useEffect(() => {
    loadBooked();
  }, [loadBooked]);

  const handleCancel = useCallback(async (slotId: string) => {
    await removeBookedAppointment(slotId);
    loadBooked();
  }, [loadBooked]);

  const next = booked[0];
  const rest = booked.slice(1);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: bgColor }]}>
      <ImageBackground
        source={background}
        style={styles.background}
        imageStyle={styles.bgImage}
      >
        <View style={styles.header}>
          <Text style={[styles.pageTitle, { fontSize: 24, fontWeight: '600', color: textColor }]}>
            Appointments
          </Text>
        </View>

        <Pressable
          style={styles.addButton}
          onPress={() => navigation.navigate('AddAppointment')}
        >
          <Text style={[styles.addButtonText, { fontSize: 16, fontWeight: '600' }]}>
            Add Appointment
          </Text>
        </Pressable>

        {next ? (
          <>
            <View style={styles.heroCard}>
              <Text style={[styles.heroLabel, { fontSize: 14, color: Colors.green }]}>
                🗓 Next Appointment
              </Text>
              <Text style={[styles.heroTitle, { fontSize: 18, fontWeight: '600', color: textColor }]}>
                {next.doctor.firstName} {next.doctor.lastName}
              </Text>
              <Text style={[styles.heroLocation, { fontSize: 14, color: '#666' }]}>
                {next.slot.branch.name}
              </Text>
              <Text style={[styles.heroTime, { fontSize: 16, color: textColor }]}>
                {new Date(next.slot.startTime).toLocaleString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </Text>
              <Pressable onPress={() => handleCancel(next.slot.slotId)}>
                <Text style={[styles.cancelText, { fontSize: 14, color: Colors.red }]}>
                  Cancel
                </Text>
              </Pressable>
            </View>

            <Text style={[styles.sectionHeader, { fontSize: 18, fontWeight: '600', color: textColor }]}>
              Upcoming Appointments
            </Text>

            <FlatList
              data={rest}
              keyExtractor={item => item.slot.slotId}
              contentContainerStyle={styles.list}
              renderItem={({ item }) => (
                <View style={styles.listCard}>
                  <View style={styles.listText}>
                    <Text style={[styles.listTitle, { fontSize: 16, fontWeight: '500', color: textColor }]}>
                      {item.doctor.firstName} {item.doctor.lastName}
                    </Text>
                    <Text style={[styles.listLocation, { fontSize: 14, color: '#666' }]}>
                      {item.slot.branch.name}
                    </Text>
                    <Text style={[styles.listTime, { fontSize: 14, color: textColor }]}>
                      {new Date(item.slot.startTime).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>
                  <Pressable onPress={() => handleCancel(item.slot.slotId)}>
                    <Text style={[styles.cancelText, { fontSize: 14, color: Colors.red }]}>
                      Cancel
                    </Text>
                  </Pressable>
                </View>
              )}
            />

            <Pressable
              style={styles.pastButton}
              onPress={() => navigation.navigate('PastAppointments')}
            >
              <Text style={[styles.pastButtonText, { fontSize: 16, fontWeight: '600' }]}>
                View Past Appointments
              </Text>
            </Pressable>
          </>
        ) : (
          <View style={styles.emptyDate}>
            <Text style={[styles.emptyText, { fontSize: 16, color: textColor }]}>
              You have no upcoming appointments.
            </Text>
            <Pressable
              style={styles.pastButtonSecondary}
              onPress={() => navigation.navigate('PastAppointments')}
            >
              <Text style={[styles.pastButtonText, { fontSize: 16, fontWeight: '600' }]}>
                View Past Appointments
              </Text>
            </Pressable>
          </View>
        )}
      </ImageBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  background: { flex: 1, width },
  bgImage: { opacity: 0.6, resizeMode: 'cover' },

  header: { padding: CARD_PADDING, marginTop: CARD_PADDING },
  pageTitle: {},

  addButton: {
    backgroundColor: Colors.green,
    marginHorizontal: CARD_PADDING,
    marginBottom: CARD_PADDING / 2,
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  addButtonText: {},

  heroCard: {
    backgroundColor: Colors.white,
    margin: CARD_PADDING,
    padding: CARD_PADDING,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  heroLabel: {},
  heroTitle: {},
  heroLocation: {},
  heroTime: {},
  cancelText: {},

  sectionHeader: {
    marginHorizontal: CARD_PADDING,
    marginTop: CARD_PADDING,
    marginBottom: 8,
  },

  list: { paddingHorizontal: CARD_PADDING },
  listCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: CARD_PADDING,
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  listText: { flex: 1, marginRight: 12 },
  listTitle: {},
  listLocation: {},
  listTime: {},

  pastButton: {
    backgroundColor: Colors.blue,
    margin: CARD_PADDING,
    padding: CARD_PADDING,
    borderRadius: 6,
    alignItems: 'center',
  },
  pastButtonSecondary: {
    backgroundColor: Colors.blue,
    marginTop: CARD_PADDING,
    padding: CARD_PADDING,
    borderRadius: 6,
    alignItems: 'center',
  },
  pastButtonText: {},

  emptyDate: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: {},

  // reuse CARD_PADDING constant
});
