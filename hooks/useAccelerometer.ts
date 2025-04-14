import { useEffect, useState } from 'react';
import { Accelerometer, AccelerometerMeasurement } from 'expo-sensors';
import { sendLocalNotification } from '../services/notifications';

// Custom hook to use the accelerometer and detect free fall
const useAccelerometer = (): AccelerometerMeasurement => {
  const [data, setData] = useState<AccelerometerMeasurement>({ x: 0, y: 0, z: 0, timestamp:0});

  useEffect(() => {
    const subscription = Accelerometer.addListener((accelerometerData) => {
      setData(accelerometerData);
      detectFreeFall(accelerometerData);
    });

    // Set the update interval for the accelerometer
    Accelerometer.setUpdateInterval(100); // 100 ms update interval

    // Cleanup the subscription on component unmount
    return () => subscription.remove();
  }, []);

  // Detect free-fall based on acceleration threshold
  const detectFreeFall = ({ x, y, z }: AccelerometerMeasurement): void => {
    const totalAcceleration = Math.sqrt(x * x + y * y + z * z);

    if (totalAcceleration < 0.3) {
      console.log('Free fall detected!');
      sendLocalNotification('⚠️ Fall Detected!', 'Your device appears to be falling.');
    }
  };

  return data;
};

export default useAccelerometer;