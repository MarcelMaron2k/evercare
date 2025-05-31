// src/services/calendarService.ts

import RNCalendarEvents from 'react-native-calendar-events';
import type { Appointment } from '../types/appointment';

export async function addAppointmentToCalendar(appointment: Appointment) {
  // 1) Request calendar permission
  const status = await RNCalendarEvents.requestPermissions();
  if (status !== 'authorized') {
    throw new Error('No calendar permission');
  }

  const { provider, doctor, slot } = appointment;

  // 2) Use the full ISO string (including milliseconds + "Z") so Android/iOS can parse it
  //    Example: "2025-06-01T09:00:00.000Z"
  const startDate = new Date(slot.startTime).toISOString();
  const endDate   = new Date(slot.endTime).toISOString();

  // 3) Build a title/notes/location
  const title = `Appointment: ${doctor.firstName} ${doctor.lastName} (${provider.name})`;

  // 4) Save to the native calendar
  await RNCalendarEvents.saveEvent(title, {
    startDate,       // e.g. "2025-06-01T09:00:00.000Z"
    endDate,         // e.g. "2025-06-01T09:30:00.000Z"
    location: slot.branch.name,
    notes: 'EverCare reminder',
  });
}
