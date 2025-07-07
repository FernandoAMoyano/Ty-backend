import { Appointment } from '../entities/Appointment';

export interface AppointmentRepository {
  // Operaciones básicas de crud
  findById(id: string): Promise<Appointment | null>;
  findAll(): Promise<Appointment[]>;
  save(appointment: Appointment): Promise<Appointment>;
  update(appointment: Appointment): Promise<Appointment>;
  delete(id: string): Promise<void>;
  existsById(id: string): Promise<boolean>;

  // Consultas específicas del negocio
  findByClientId(clientId: string): Promise<Appointment[]>;
  findByStylistId(stylistId: string): Promise<Appointment[]>;
  findByUserId(userId: string): Promise<Appointment[]>;
  findByStatusId(statusId: string): Promise<Appointment[]>;

  // Consultas basadas en fechas
  findByDateRange(startDate: Date, endDate: Date): Promise<Appointment[]>;
  findByClientAndDateRange(
    clientId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<Appointment[]>;
  findByStylistAndDateRange(
    stylistId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<Appointment[]>;

  // Detección de conflictos
  findConflictingAppointments(
    dateTime: Date,
    duration: number,
    stylistId?: string,
    excludeAppointmentId?: string,
  ): Promise<Appointment[]>;

  // Consultas basadas en programas
  findByScheduleId(scheduleId: string): Promise<Appointment[]>;
  findByDate(date: Date): Promise<Appointment[]>;

  // Consultas de análisis
  countByStatus(statusId: string): Promise<number>;
  countByDateRange(startDate: Date, endDate: Date): Promise<number>;
  findUpcomingAppointments(limit?: number): Promise<Appointment[]>;
  findPendingConfirmation(): Promise<Appointment[]>;
}
