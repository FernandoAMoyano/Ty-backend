import { AppointmentStatus } from '../entities/AppointmentStatus';

/**
 * Interfaz del repositorio para la gestión de persistencia de estados de citas
 * Define todos los métodos necesarios para operaciones CRUD y consultas específicas de estados
 */
export interface AppointmentStatusRepository {
  // Operaciones básicas de crud

  /**
   * Busca un estado de cita por su ID único
   * @param id - ID único del estado a buscar
   * @returns Promise que resuelve con el estado encontrado o null si no existe
   */
  findById(id: string): Promise<AppointmentStatus | null>;

  /**
   * Busca un estado de cita por su nombre
   * @param name - Nombre del estado a buscar (ej: "PENDING", "CONFIRMED")
   * @returns Promise que resuelve con el estado encontrado o null si no existe
   */
  findByName(name: string): Promise<AppointmentStatus | null>;

  /**
   * Obtiene todos los estados de citas disponibles en el sistema
   * @returns Promise que resuelve con un array de todos los estados
   */
  findAll(): Promise<AppointmentStatus[]>;

  /**
   * Guarda un nuevo estado de cita en el sistema
   * @param status - Entidad de estado a guardar
   * @returns Promise que resuelve con el estado guardado (con ID asignado)
   */
  save(status: AppointmentStatus): Promise<AppointmentStatus>;

  /**
   * Actualiza un estado de cita existente en el sistema
   * @param status - Entidad de estado con los datos actualizados
   * @returns Promise que resuelve con el estado actualizado
   */
  update(status: AppointmentStatus): Promise<AppointmentStatus>;

  /**
   * Elimina un estado de cita del sistema de forma permanente
   * @param id - ID único del estado a eliminar
   * @returns Promise que resuelve cuando la eliminación se completa
   */
  delete(id: string): Promise<void>;

  // Controles de existencia

  /**
   * Verifica si existe un estado con el ID especificado
   * @param id - ID único del estado a verificar
   * @returns Promise que resuelve con true si existe, false en caso contrario
   */
  existsById(id: string): Promise<boolean>;

  /**
   * Verifica si existe un estado con el nombre especificado
   * @param name - Nombre del estado a verificar
   * @returns Promise que resuelve con true si existe, false en caso contrario
   */
  existsByName(name: string): Promise<boolean>;

  // Consultas de negocios

  /**
   * Busca todos los estados que son considerados terminales (estados finales)
   * Los estados terminales son aquellos que no permiten más transiciones (COMPLETED, CANCELLED, NO_SHOW)
   * @returns Promise que resuelve con un array de estados terminales
   */
  findTerminalStatuses(): Promise<AppointmentStatus[]>;

  /**
   * Busca todos los estados que se consideran activos (no terminales)
   * Los estados activos son aquellos que permiten transiciones a otros estados (PENDING, CONFIRMED, IN_PROGRESS)
   * @returns Promise que resuelve con un array de estados activos
   */
  findActiveStatuses(): Promise<AppointmentStatus[]>;
}
