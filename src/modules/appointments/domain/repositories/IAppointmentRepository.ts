import { Appointment } from '../entities/Appointment';

/**
 * Interfaz del repositorio para la gestión de persistencia de citas
 * Define todos los métodos necesarios para operaciones CRUD y consultas específicas del negocio
 */
export interface IAppointmentRepository {
  findById(id: string): Promise<Appointment | null>;
  findAll(): Promise<Appointment[]>;
  save(appointment: Appointment): Promise<Appointment>;
  update(appointment: Appointment): Promise<Appointment>;
  delete(id: string): Promise<void>;
  existsById(id: string): Promise<boolean>;
  findByClientId(clientId: string): Promise<Appointment[]>;
  findByStylistId(stylistId: string): Promise<Appointment[]>;
  findByUserId(userId: string): Promise<Appointment[]>;
  findByStatusId(statusId: string): Promise<Appointment[]>;
  findByDateRange(startDate: Date, endDate: Date): Promise<Appointment[]>;
  findByClientAndDateRange(clientId: string, startDate: Date, endDate: Date): Promise<Appointment[]>;
  findByStylistAndDateRange(stylistId: string, startDate: Date, endDate: Date): Promise<Appointment[]>;
  findConflictingAppointments(dateTime: Date, duration: number, stylistId?: string, excludeAppointmentId?: string): Promise<Appointment[]>;
  findByScheduleId(scheduleId: string): Promise<Appointment[]>;
  findByDate(date: Date): Promise<Appointment[]>;
  countByStatus(statusId: string): Promise<number>;
  countByDateRange(startDate: Date, endDate: Date): Promise<number>;
  findUpcomingAppointments(limit?: number): Promise<Appointment[]>;
  findPendingConfirmation(): Promise<Appointment[]>;
}
