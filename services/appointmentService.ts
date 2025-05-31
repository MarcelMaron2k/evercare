// src/services/appointmentService.ts

import AsyncStorage from '@react-native-async-storage/async-storage';
import providersRaw from '../mocks/providers.json';
import maccabiRaw from '../mocks/maccabiSlots.json';
import clalitRaw from '../mocks/clalitSlots.json';
import maccabiDoctorsRaw from '../mocks/maccabiDoctors.json';
import clalitDoctorsRaw from '../mocks/clalitDoctors.json';
import type { Provider, Doctor, Slot, Appointment } from '../types/appointment';

/**
 * Returns a list of all providers from the local mock JSON.
 */
export function getProviders(): Provider[] {
  return providersRaw as Provider[];
}

/**
 * Returns a list of doctors for the given providerId,
 * mapping mock JSON structure to the Doctor type.
 */
export async function getDoctors(providerId: string): Promise<Doctor[]> {
  if (providerId === 'maccabi') {
    return (maccabiDoctorsRaw.doctors as any[]).map((d) => ({
      id: d.id,
      firstName: d.firstName,
      lastName: d.lastName,
      specialty: d.specialty,
      clinics: d.clinics,
    }));
  } else if (providerId === 'clalit') {
    return (clalitDoctorsRaw.doctors as any[]).map((d) => ({
      id: d.id,
      firstName: d.firstName,
      lastName: d.lastName,
      specialty: d.specialty,
      clinics: d.clinics,
    }));
  }
  return [];
}

/**
 * Returns a list of available slots for the given providerId and doctorId,
 * mapping mock JSON structure to the Slot type.
 *
 * The fromDate and toDate parameters are currently unused
 * since this mock always returns the full set of slots.
 */
export async function getSlots(
  providerId: string,
  doctorId: string,
  fromDate: string,
  toDate: string
): Promise<Slot[]> {
  if (providerId === 'maccabi') {
    return (maccabiRaw.slots as any[]).map((s) => ({
      slotId: s.slotId,
      doctorId: s.doctorId,
      startTime: s.startTime,
      endTime: s.endTime,
      branch: s.branch,
      isAvailable: s.isAvailable,
    }));
  } else if (providerId === 'clalit') {
    return (clalitRaw.AvailableSlots as any[]).map((s) => ({
      slotId: s.SlotId,
      doctorId: s.DoctorId,
      startTime: s.SlotDateTime,
      endTime: new Date(
        new Date(s.SlotDateTime).getTime() + 30 * 60000
      ).toISOString(),
      branch: {
        id: s.Location.SiteCode,
        name: s.Location.SiteName,
        address: s.Location.Address,
        city: s.Location.City,
      },
      isAvailable: s.Status === 'Open',
    }));
  }
  return [];
}

// ------------------------------------------------------------------------------------------------
// BELOW: Local persistence for “booked” appointments using AsyncStorage.
// Includes functions to get, save, remove, and clear appointments.
// ------------------------------------------------------------------------------------------------

const STORAGE_KEY = 'BOOKED_APPOINTMENTS';

/**
 * Retrieves the array of locally‐booked appointments from AsyncStorage.
 * If none are found, returns an empty array.
 */
export async function getBookedAppointments(): Promise<Appointment[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    return JSON.parse(raw) as Appointment[];
  } catch (err) {
    console.error('Error reading booked appointments from storage:', err);
    return [];
  }
}

/**
 * Saves one new appointment to the local AsyncStorage list.
 * Appends to any existing list under STORAGE_KEY. If the key does not exist,
 * it creates a new array. Throws if saving fails.
 */
export async function saveBookedAppointment(appt: Appointment): Promise<void> {
  try {
    const current = await getBookedAppointments();
    const updated = [...current, appt];
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Error saving booked appointment to storage:', err);
    throw err;
  }
}

/**
 * Removes any booked appointment(s) whose slotId matches the provided slotId.
 * Reads the current list, filters out matches, and re‐saves the remainder.
 */
export async function removeBookedAppointment(slotId: string): Promise<void> {
  try {
    const current = await getBookedAppointments();
    const filtered = current.filter((a) => a.slot.slotId !== slotId);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (err) {
    console.error('Error removing booked appointment from storage:', err);
    throw err;
  }
}

/**
 * Clears all locally‐booked appointments from AsyncStorage.
 * Useful for debugging or resetting state.
 */
export async function clearBookedAppointments(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error('Error clearing booked appointments from storage:', err);
  }
}
