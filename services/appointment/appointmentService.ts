export interface Slot {
  id: string;
  start: string;       // ISO datetime, e.g. "2025-08-15T09:30:00Z"
  end: string;         // ISO datetime
  practitioner: string;
  location: string;
}

export type AppointmentStatus = 'scheduled' | 'cancelled';

export interface Appointment {
  id: string;               // Firestore doc ID or external API ID
  slot: Slot;
  status: AppointmentStatus;
  notes?: string;
  provider: string;         // e.g. "Maccabi"
}

export interface AppointmentService {
  /** Returns supported providers, e.g. ["Maccabi"] */
  listProviders(): Promise<string[]>;

  /** Fetch available slots for a given provider and date (YYYY-MM-DD) */
  listSlots(provider: string, date: string): Promise<Slot[]>;

  /** Book a slot; returns created Appointment */
  bookAppointment(
    provider: string,
    slot: Slot,
    notes?: string
  ): Promise<Appointment>;

  /** List all appointments for current user */
  getAppointments(): Promise<Appointment[]>;

  /** Cancel an appointment by ID */
  cancelAppointment(appointmentId: string): Promise<void>;
}
