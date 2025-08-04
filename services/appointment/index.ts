import { AppointmentService } from './AppointmentService';
import { FirebaseAppointmentService } from './firebaseappointmentService';
import { MaccabiAppointmentService } from './MaccabiAppointmentService';

// Switch between local (Firebase) and live (Maccabi) by commenting:
export const appointmentService: AppointmentService = new FirebaseAppointmentService();
// export const appointmentService: AppointmentService = new MaccabiAppointmentService();
