// src/navigation/AppNavigator.tsx

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HomeScreen from '../screens/home';
import MedicationScreen from '../screens/medication';
import AppointmentCenter from '../screens/appointmentCenter';
import AddAppointment from '../screens/addAppointment';           // now exports AddAppointment
import UpcomingAppointments from '../screens/upcomingAppointments';
import PastAppointments from '../screens/pastappointmets';

export type AppStackParamList = {
  Home: undefined;
  Medications: undefined;
  AppointmentCenter: undefined;
  Appointments: undefined;            // “Add Appointment” route
  UpcomingAppointments: undefined;
  PastAppointments: undefined;
};

const Stack = createNativeStackNavigator<AppStackParamList>();

export default function AppNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {/* Home Screen */}
      <Stack.Screen name="Home" component={HomeScreen} />

      {/* Medications Screen */}
      <Stack.Screen name="Medications" component={MedicationScreen} />

      {/* Appointment Center (hub) */}
      <Stack.Screen name="AppointmentCenter" component={AppointmentCenter} />

      {/* Add Appointment */}
      <Stack.Screen
        name="Appointments"
        component={AddAppointment}
      />

      {/* Upcoming Appointments */}
      <Stack.Screen
        name="UpcomingAppointments"
        component={UpcomingAppointments}
      />

      {/* Past Appointments */}
      <Stack.Screen
        name="PastAppointments"
        component={PastAppointments}
      />
    </Stack.Navigator>
  );
}
