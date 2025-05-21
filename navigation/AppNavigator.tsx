// src/navigation/AppNavigator.tsx
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen        from '../screens/home';
import MedicationScreen  from '../screens/medication';

export type AppTabParamList = {
  Home:        undefined;
  Medications: undefined;
};

const Tab = createBottomTabNavigator<AppTabParamList>();

export default function AppNavigator() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Home"        component={HomeScreen} />
      <Tab.Screen name="Medications" component={MedicationScreen} />
    </Tab.Navigator>
  );
}
