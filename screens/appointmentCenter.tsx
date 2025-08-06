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
import { SettingsContext } from '../context/SettingsContext';
import { useTheme } from '../utils/theme';
import {
  getBookedAppointments,
  removeBookedAppointment,
} from '../services/appointment/appointmentService';
import type { Appointment } from '../types/appointment';

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
  const { colors, typography, backgroundImage } = useTheme();

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
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ImageBackground
        source={backgroundImage}
        style={styles.background}
        imageStyle={styles.bgImage}
      >
        <View style={styles.header}>
          <Text style={[styles.pageTitle, { fontSize: 24, fontWeight: '600', color: typography.textColor }]}>
            Appointments
          </Text>
        </View>

        <Pressable
          style={[styles.addButton, { backgroundColor: colors.success }]}
          onPress={() => navigation.navigate('AddAppointment')}
        >
          <Text style={[styles.addButtonText, { fontSize: 16, fontWeight: '600', color: colors.card }]}>
            Add Appointment
          </Text>
        </Pressable>

        {next ? (
          <>
            <View style={[styles.heroCard, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
              <Text style={[styles.heroLabel, { fontSize: 14, color: colors.success }]}>
                🗓 Next Appointment
              </Text>
              <Text style={[styles.heroTitle, { fontSize: 18, fontWeight: '600', color: typography.textColor }]}>
                {next.doctor.firstName} {next.doctor.lastName}
              </Text>
              <Text style={[styles.heroLocation, { fontSize: 14, color: colors.textSecondary }]}>
                {next.slot.branch.name}
              </Text>
              <Text style={[styles.heroTime, { fontSize: 16, color: typography.textColor }]}>
                {new Date(next.slot.startTime).toLocaleString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </Text>
              <Pressable onPress={() => handleCancel(next.slot.slotId)}>
                <Text style={[styles.cancelText, { fontSize: 14, color: colors.danger }]}>
                  Cancel
                </Text>
              </Pressable>
            </View>

            <Text style={[styles.sectionHeader, { fontSize: 18, fontWeight: '600', color: typography.textColor }]}>
              Upcoming Appointments
            </Text>

            <FlatList
              data={rest}
              keyExtractor={item => item.slot.slotId}
              contentContainerStyle={styles.list}
              renderItem={({ item }) => (
                <View style={[styles.listCard, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
                  <View style={styles.listText}>
                    <Text style={[styles.listTitle, { fontSize: 16, fontWeight: '500', color: typography.textColor }]}>
                      {item.doctor.firstName} {item.doctor.lastName}
                    </Text>
                    <Text style={[styles.listLocation, { fontSize: 14, color: colors.textSecondary }]}>
                      {item.slot.branch.name}
                    </Text>
                    <Text style={[styles.listTime, { fontSize: 14, color: typography.textColor }]}>
                      {new Date(item.slot.startTime).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>
                  <Pressable onPress={() => handleCancel(item.slot.slotId)}>
                    <Text style={[styles.cancelText, { fontSize: 14, color: colors.danger }]}>
                      Cancel
                    </Text>
                  </Pressable>
                </View>
              )}
            />

            <Pressable
              style={[styles.pastButton, { backgroundColor: colors.primary }]}
              onPress={() => navigation.navigate('PastAppointments')}
            >
              <Text style={[styles.pastButtonText, { fontSize: 16, fontWeight: '600', color: colors.card }]}>
                View Past Appointments
              </Text>
            </Pressable>
          </>
        ) : (
          <View style={styles.emptyDate}>
            <Text style={[styles.emptyText, { fontSize: 16, color: typography.textColor }]}>
              You have no upcoming appointments.
            </Text>
            <Pressable
              style={[styles.pastButtonSecondary, { backgroundColor: colors.primary }]}
              onPress={() => navigation.navigate('PastAppointments')}
            >
              <Text style={[styles.pastButtonText, { fontSize: 16, fontWeight: '600', color: colors.card }]}>
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
    marginHorizontal: CARD_PADDING,
    marginBottom: CARD_PADDING / 2,
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  addButtonText: {},

  heroCard: {
    margin: CARD_PADDING,
    padding: CARD_PADDING,
    borderRadius: 8,
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
    padding: CARD_PADDING,
    borderRadius: 8,
    marginBottom: 12,
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
    margin: CARD_PADDING,
    padding: CARD_PADDING,
    borderRadius: 6,
    alignItems: 'center',
  },
  pastButtonSecondary: {
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
