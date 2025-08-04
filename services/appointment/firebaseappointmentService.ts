import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import {
  AppointmentService,
  Slot,
  Appointment,
} from './AppointmentService';

// Static imports for each provider’s mock slots
import providersMock from '../../mocks/providers.json';
import maccabiSlotsMock from '../../mocks/maccabiSlots.json';
import clalitSlotsMock  from '../../mocks/clalitSlots.json';
import meuhedetSlotsMock from '../../mocks/meuhedetSlots.json';
import leumitSlotsMock   from '../../mocks/leumitSlots.json';

const slotMocks: Record<string, Slot[]> = {
  maccabi:   maccabiSlotsMock as Slot[],
  clalit:    clalitSlotsMock  as Slot[],
  meuhedet:  meuhedetSlotsMock as Slot[],
  leumit:    leumitSlotsMock   as Slot[],
};

export class FirebaseAppointmentService implements AppointmentService {
  async listProviders(): Promise<string[]> {
    // providersMock is a string[] loaded from src/mocks/providers.json
    return providersMock as string[];
  }

  async listSlots(provider: string, date: string): Promise<Slot[]> {
    // Normalize to lowercase key
    const key = provider.toLowerCase();
    const allSlots = slotMocks[key] || [];
    // Filter by ISO date prefix "YYYY-MM-DD"
    return allSlots.filter(slot => slot.start.startsWith(date));
  }

  async bookAppointment(
    provider: string,
    slot: Slot,
    notes?: string
  ): Promise<Appointment> {
    const user = auth().currentUser;
    if (!user) throw new Error('User not authenticated');

    const docRef = await firestore()
      .collection('users')
      .doc(user.uid)
      .collection('appointments')
      .add({
        provider,
        slot,
        status: 'scheduled',
        notes: notes || '',
      });

    const snap = await docRef.get();
    const data = snap.data() as Omit<Appointment, 'id'>;
    return { id: docRef.id, ...data };
  }

  async getAppointments(): Promise<Appointment[]> {
    const user = auth().currentUser;
    if (!user) throw new Error('User not authenticated');

    const snap = await firestore()
      .collection('users')
      .doc(user.uid)
      .collection('appointments')
      .orderBy('slot.start')
      .get();

    return snap.docs.map(doc => {
      const data = doc.data() as Omit<Appointment, 'id'>;
      return { id: doc.id, ...data };
    });
  }

  async cancelAppointment(appointmentId: string): Promise<void> {
    const user = auth().currentUser;
    if (!user) throw new Error('User not authenticated');

    await firestore()
      .collection('users')
      .doc(user.uid)
      .collection('appointments')
      .doc(appointmentId)
      .update({ status: 'cancelled' });
  }
}