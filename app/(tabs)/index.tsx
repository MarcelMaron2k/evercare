import React from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';
import { useRouter } from 'expo-router';
import { PermissionsAndroid, Platform } from 'react-native';

export default function HomeScreen() {
  const router = useRouter();
  requestPermissions();
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to Fall Detector App!</Text>
      <Button title="Go to Fall Detector" onPress={() => router.navigate('/(tabs)/fall')} />
    </View>
  );
}

const requestPermissions = async () => {
  if (Platform.OS === 'android') {
    try {
      // Request multiple permissions
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.ACTIVITY_RECOGNITION,
        PermissionsAndroid.PERMISSIONS.BODY_SENSORS,
        PermissionsAndroid.PERMISSIONS.FOREGROUND_SERVICE, // Correct permission reference
      ]);
      
      console.log('Permission results:', granted);
    } catch (err) {
      console.warn('Permission request error:', err);
    }
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
  },
});