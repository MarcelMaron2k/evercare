// src/services/appointmentService.ts

import AsyncStorage from '@react-native-async-storage/async-storage';
import providersRaw from '../../mocks/providers.json';
import maccabiRaw   from '../../mocks/maccabiSlots.json';
import clalitRaw    from '../../mocks/clalitSlots.json';
import type { Provider, Slot, Appointment } from '../../types/appointment';

const STORAGE_KEY = 'BOOKED_APPOINTMENTS';

/** Return all providers */
export function getProviders(): Provider[] {
  return providersRaw as Provider[];
}

/**
 * Fetch all open slots for the given providerId.
 * Both Clalit and Maccabi mocks conform to the same schema.
 */
export async function getSlots(providerId: string): Promise<Slot[]> {
  let source: any[] = [];

  if (providerId === 'maccabi') {
    source = maccabiRaw.slots;
  } else if (providerId === 'clalit') {
    source = clalitRaw.slots;
  }

  return source
    .filter(s => 
      // Maccabi uses isAvailable; Clalit uses status === 'Open'
      (s.isAvailable ?? (s.status === 'Open'))
    )
    .map(s => ({
      slotId:      s.slotId,
      doctorId:    s.doctorId,
      startTime:   s.startTime ?? s.slotDateTime,
      endTime:     s.endTime ?? new Date(
                      new Date(s.startTime ?? s.slotDateTime).getTime() + 30*60000
                    ).toISOString(),
      branch:      s.branch ?? {
                      id:      s.location.siteCode,
                      name:    s.location.siteName,
                      address: s.location.address,
                      city:    s.location.city,
                    },
      isAvailable: true, // after filter they’re all open
    }));
}

/** Local persistence for booked appointments */
export async function getBookedAppointments(): Promise<Appointment[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function saveBookedAppointment(appt: Appointment): Promise<void> {
  const current = await getBookedAppointments();
  await AsyncStorage.setItem(
    STORAGE_KEY,
    JSON.stringify([...current, appt])
  );
}

export async function removeBookedAppointment(slotId: string): Promise<void> {
  const current  = await getBookedAppointments();
  const filtered = current.filter(a => a.slot.slotId !== slotId);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}

export async function clearBookedAppointments(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}
