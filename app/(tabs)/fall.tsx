import React, { useEffect } from 'react';
import { Text, View, StyleSheet } from 'react-native';
import useAccelerometer from '../../hooks/useAccelerometer';
import { registerForPushNotificationsAsync } from '../../services/notifications';

export default function FallDetectorScreen() {
  const { x, y, z } = useAccelerometer();

  useEffect(() => {
    registerForPushNotificationsAsync();
  }, []);

  const totalAcceleration = Math.sqrt(x * x + y * y + z * z).toFixed(2);

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Accelerometer:</Text>
      <Text style={styles.text}>x: {x.toFixed(2)}</Text>
      <Text style={styles.text}>y: {y.toFixed(2)}</Text>
      <Text style={styles.text}>z: {z.toFixed(2)}</Text>
      <Text style={styles.text}>Total Acceleration: {totalAcceleration}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  text: {
    fontSize: 18,
    marginBottom: 5,
  },
});