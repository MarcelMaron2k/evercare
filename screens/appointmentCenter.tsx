import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppStackParamList } from '../navigation/AppNavigator';
// Adjust this import path to where your React Navigation types are defined.
// If you haven’t typed your navigator, you can replace `RootStackParamList` with `any`.
type Props = NativeStackScreenProps<AppStackParamList, 'AppointmentCenter'>;

const AppointmentCenter: React.FC<Props> = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Appointment Center</Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('Appointments')}
      >
        <Text style={styles.buttonText}>Add Appointment</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('UpcomingAppointments')}
      >
        <Text style={styles.buttonText}>Upcoming Appointments</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('PastAppointments')}
      >
        <Text style={styles.buttonText}>Past Appointments</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'flex-start',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 32,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginVertical: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
    fontWeight: '500',
  },
});

export default AppointmentCenter;