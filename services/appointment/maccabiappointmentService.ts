import {
  AppointmentService,
  Slot,
  Appointment,
} from './AppointmentService';

export class MaccabiAppointmentService implements AppointmentService {
  async listProviders(): Promise<string[]> {
    // Placeholder; real implementation will call Maccabi sandbox API
    return ['Maccabi'];
  }

  async listSlots(provider: string, date: string): Promise<Slot[]> {
    // TODO: implement fetch from Maccabi FHIR/REST endpoint
    throw new Error('Maccabi.listSlots not implemented');
  }

  async bookAppointment(
    provider: string,
    slot: Slot,
    notes?: string
  ): Promise<Appointment> {
    // TODO: call Maccabi API to book; then return Appointment
    throw new Error('Maccabi.bookAppointment not implemented');
  }

  async getAppointments(): Promise<Appointment[]> {
    // TODO: fetch user appointments from Maccabi API
    throw new Error('Maccabi.getAppointments not implemented');
  }

  async cancelAppointment(appointmentId: string): Promise<void> {
    // TODO: call Maccabi API to cancel
    throw new Error('Maccabi.cancelAppointment not implemented');
  }
}