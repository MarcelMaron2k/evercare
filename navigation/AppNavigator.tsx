// src/navigation/AppNavigator.tsx

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HomeScreen from '../screens/home';
import MedicationScreen from '../screens/medication';
import AppointmentCenter from '../screens/appointmentCenter';
import AddAppointment from '../screens/addAppointment';           
import UpcomingAppointments from '../screens/upcomingAppointments';
import PastAppointments from '../screens/pastappointmets';
import AppSettings from '../screens/appsettings';
import UserSettings from '../screens/usersettings';
import HistoryScreen from '../screens/history';
import SupportScreen from '../screens/SupportScreen';

export type AppStackParamList = {
  Home: undefined;
  Medications: undefined;
  AppointmentCenter: undefined;
  AddAppointment: undefined;            
  UpcomingAppointments: undefined;
  PastAppointments: undefined;
  AppSettings: undefined;
  UserSettings: undefined;
  History: undefined;
  Settings: undefined;
  SupportScreen:undefined;
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
        name="AddAppointment"
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
      {/* app settings */}
      <Stack.Screen
        name="AppSettings"
        component={AppSettings}
      />
      
      {/* user settings */}
      <Stack.Screen
        name="UserSettings"
        component={UserSettings}
      />

      {/* Fall History */}
      <Stack.Screen
        name="History"
        component={HistoryScreen}
      />
      {/* support */}
      <Stack.Screen
        name="SupportScreen"
        component={SupportScreen}
      />
    </Stack.Navigator>
  );
}
