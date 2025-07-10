import { Appointment } from '../entities/Appointment';

/**
 * Interfaz del repositorio para la gestión de persistencia de citas
 * Define todos los métodos necesarios para operaciones CRUD y consultas específicas del negocio
 */
export interface AppointmentRepository {
  // Operaciones básicas de crud

  /**
   * Busca una cita por su ID único
   * @param id - ID único de la cita a buscar
   * @returns Promise que resuelve con la cita encontrada o null si no existe
   */
  findById(id: string): Promise<Appointment | null>;

  /**
   * Obtiene todas las citas del sistema
   * @returns Promise que resuelve con un array de todas las citas
   */
  findAll(): Promise<Appointment[]>;

  /**
   * Guarda una nueva cita en el sistema
   * @param appointment - Entidad de cita a guardar
   * @returns Promise que resuelve con la cita guardada (con ID asignado)
   */
  save(appointment: Appointment): Promise<Appointment>;

  /**
   * Actualiza una cita existente en el sistema
   * @param appointment - Entidad de cita con los datos actualizados
   * @returns Promise que resuelve con la cita actualizada
   */
  update(appointment: Appointment): Promise<Appointment>;

  /**
   * Elimina una cita del sistema de forma permanente
   * @param id - ID único de la cita a eliminar
   * @returns Promise que resuelve cuando la eliminación se completa
   */
  delete(id: string): Promise<void>;

  /**
   * Verifica si existe una cita con el ID especificado
   * @param id - ID único de la cita a verificar
   * @returns Promise que resuelve con true si existe, false en caso contrario
   */
  existsById(id: string): Promise<boolean>;

  // Consultas específicas del negocio

  /**
   * Busca todas las citas asignadas a un cliente específico
   * @param clientId - ID único del cliente
   * @returns Promise que resuelve con un array de citas del cliente
   */
  findByClientId(clientId: string): Promise<Appointment[]>;

  /**
   * Busca todas las citas asignadas a un estilista específico
   * @param stylistId - ID único del estilista
   * @returns Promise que resuelve con un array de citas del estilista
   */
  findByStylistId(stylistId: string): Promise<Appointment[]>;

  /**
   * Busca todas las citas creadas por un usuario específico
   * @param userId - ID único del usuario creador
   * @returns Promise que resuelve con un array de citas creadas por el usuario
   */
  findByUserId(userId: string): Promise<Appointment[]>;

  /**
   * Busca todas las citas que tienen un estado específico
   * @param statusId - ID único del estado
   * @returns Promise que resuelve con un array de citas con ese estado
   */
  findByStatusId(statusId: string): Promise<Appointment[]>;

  // Consultas basadas en fechas

  /**
   * Busca todas las citas dentro de un rango de fechas específico
   * @param startDate - Fecha de inicio del rango (inclusive)
   * @param endDate - Fecha de fin del rango (inclusive)
   * @returns Promise que resuelve con un array de citas en el rango especificado
   */
  findByDateRange(startDate: Date, endDate: Date): Promise<Appointment[]>;

  /**
   * Busca las citas de un cliente específico dentro de un rango de fechas
   * @param clientId - ID único del cliente
   * @param startDate - Fecha de inicio del rango
   * @param endDate - Fecha de fin del rango
   * @returns Promise que resuelve con un array de citas del cliente en el período
   */
  findByClientAndDateRange(
    clientId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<Appointment[]>;

  /**
   * Busca las citas de un estilista específico dentro de un rango de fechas
   * @param stylistId - ID único del estilista
   * @param startDate - Fecha de inicio del rango
   * @param endDate - Fecha de fin del rango
   * @returns Promise que resuelve con un array de citas del estilista en el período
   */
  findByStylistAndDateRange(
    stylistId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<Appointment[]>;

  // Detección de conflictos

  /**
   * Busca citas que puedan tener conflicto de horario con una nueva cita
   * @param dateTime - Fecha y hora de la nueva cita
   * @param duration - Duración en minutos de la nueva cita
   * @param stylistId - ID del estilista (opcional, para conflictos por estilista)
   * @param excludeAppointmentId - ID de cita a excluir de la búsqueda (para actualizaciones)
   * @returns Promise que resuelve con un array de citas en conflicto
   */
  findConflictingAppointments(
    dateTime: Date,
    duration: number,
    stylistId?: string,
    excludeAppointmentId?: string,
  ): Promise<Appointment[]>;

  // Consultas basadas en programas

  /**
   * Busca todas las citas asociadas a un horario específico
   * @param scheduleId - ID único del horario
   * @returns Promise que resuelve con un array de citas del horario
   */
  findByScheduleId(scheduleId: string): Promise<Appointment[]>;

  /**
   * Busca todas las citas programadas para una fecha específica
   * @param date - Fecha para buscar citas (sin considerar la hora)
   * @returns Promise que resuelve con un array de citas del día
   */
  findByDate(date: Date): Promise<Appointment[]>;

  // Consultas de análisis

  /**
   * Cuenta el número de citas que tienen un estado específico
   * @param statusId - ID único del estado a contar
   * @returns Promise que resuelve con el número de citas con ese estado
   */
  countByStatus(statusId: string): Promise<number>;

  /**
   * Cuenta el número de citas dentro de un rango de fechas
   * @param startDate - Fecha de inicio del conteo
   * @param endDate - Fecha de fin del conteo
   * @returns Promise que resuelve con el número de citas en el período
   */
  countByDateRange(startDate: Date, endDate: Date): Promise<number>;

  /**
   * Busca las próximas citas programadas ordenadas por fecha
   * @param limit - Número máximo de citas a retornar (opcional)
   * @returns Promise que resuelve con un array de citas próximas
   */
  findUpcomingAppointments(limit?: number): Promise<Appointment[]>;

  /**
   * Busca todas las citas que están pendientes de confirmación
   * @returns Promise que resuelve con un array de citas pendientes
   */
  findPendingConfirmation(): Promise<Appointment[]>;
}
