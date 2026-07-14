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
  /**
   * Busca citas de un cliente de forma paginada, aplicando el filtro de
   * ownership directamente en la query (no en memoria -- ver F17/F3)
   * @param ownershipFilter - Cuando está presente, restringe adicionalmente
   * el resultado a citas donde el requester (STYLIST) es el estilista
   * asignado o el creador de la cita
   */
  findByClientIdPaginated(
    clientId: string,
    limit: number,
    offset: number,
    ownershipFilter?: { stylistId?: string; userId?: string },
  ): Promise<Appointment[]>;
  /** Cuenta citas de un cliente aplicando el mismo ownershipFilter que findByClientIdPaginated */
  countByClientId(
    clientId: string,
    ownershipFilter?: { stylistId?: string; userId?: string },
  ): Promise<number>;
  /**
   * Busca citas de un estilista de forma paginada, aplicando el filtro de
   * ownership directamente en la query (no en memoria -- ver F17/F3)
   * @param ownershipFilter - Cuando está presente, restringe adicionalmente
   * el resultado a citas donde el requester (CLIENT) es el cliente o el
   * creador de la cita
   */
  findByStylistIdPaginated(
    stylistId: string,
    limit: number,
    offset: number,
    ownershipFilter?: { userId?: string; clientId?: string },
  ): Promise<Appointment[]>;
  /** Cuenta citas de un estilista aplicando el mismo ownershipFilter que findByStylistIdPaginated */
  countByStylistId(
    stylistId: string,
    ownershipFilter?: { userId?: string; clientId?: string },
  ): Promise<number>;
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
  /** Verifica si existe cualquier cita (activa o histórica) asociada al servicio */
  existsByServiceId(serviceId: string): Promise<boolean>;
}
