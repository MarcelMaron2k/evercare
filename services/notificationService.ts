import PushNotification, {
  PushNotificationScheduleObject,
} from 'react-native-push-notification';

/**
 * Create or update the "appointments" notification channel on Android.
 *
 * Without creating a channel on API 26+ devices, scheduled notifications will not appear.
 */
export const initNotificationChannel = (): void => {
  PushNotification.createChannel(
    {
      channelId: 'appointments',
      channelName: 'Appointment Reminders',
      channelDescription: 'Reminders for upcoming appointments',
      soundName: 'default',
      importance: 4, // Importance.HIGH
      vibrate: true,
    },
    (created: boolean) =>
      console.log(
        `Notification channel ${
          created ? 'created' : 'already exists'
        }`,
      ),
  );
};

/**
 * Schedule a local notification for an appointment.
 *
 * @param notificationId A unique string used to identify this reminder.  Use the
 *                       same id later when calling cancelAppointmentNotification().
 * @param fireDate The Date when the reminder should trigger.
 * @param title Title shown in the notification.
 * @param message Body text shown in the notification.
 */
export function scheduleAppointmentNotification(
  notificationId: string,
  fireDate: Date,
  title: string,
  message: string,
): void {
  const options: PushNotificationScheduleObject = {
    id: notificationId,
    date: fireDate, // required for scheduled notifications
    channelId: 'appointments',
    title,
    message,
    allowWhileIdle: true,
    playSound: true,
    soundName: 'default',
  };

  PushNotification.localNotificationSchedule(options);
}

/**
 * Cancel a previously scheduled appointment reminder.
 *
 * @param notificationId The id passed to scheduleAppointmentNotification().
 */
export function cancelAppointmentNotification(
  notificationId: string,
): void {
  PushNotification.cancelLocalNotification(notificationId);
}
