export interface Provider { id: string; name: string; }
export interface Clinic { id: string; name: string; address?: string; city?: string; }
export interface Doctor { id: string; firstName: string; lastName: string; specialty: string; clinics: Clinic[]; }
export interface Slot { slotId: string; doctorId: string; startTime: string; endTime: string; branch: Clinic; isAvailable: boolean; }
export interface Appointment { provider: Provider; doctor: Doctor; slot: Slot; }