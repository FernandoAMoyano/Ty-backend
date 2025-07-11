import { StylistService } from '../entities/StylistService';

/**
 * Interfaz del repositorio para la gestión de persistencia de asignaciones estilista-servicio
 * Define todos los métodos necesarios para operaciones CRUD y consultas específicas de asignaciones
 */
export interface StylistServiceRepository {
  /**
   * Busca una asignación específica entre un estilista y un servicio
   * @param stylistId - ID único del estilista
   * @param serviceId - ID único del servicio
   * @returns Promise que resuelve con la asignación encontrada o null si no existe
   */
  findByStylistAndService(stylistId: string, serviceId: string): Promise<StylistService | null>;

  /**
   * Busca todas las asignaciones de servicios para un estilista específico
   * @param stylistId - ID único del estilista
   * @returns Promise que resuelve con un array de asignaciones del estilista
   */
  findByStylist(stylistId: string): Promise<StylistService[]>;

  /**
   * Busca todas las asignaciones de estilistas para un servicio específico
   * @param serviceId - ID único del servicio
   * @returns Promise que resuelve con un array de asignaciones del servicio
   */
  findByService(serviceId: string): Promise<StylistService[]>;

  /**
   * Busca solo las asignaciones activas (que están siendo ofrecidas) de un estilista
   * @param stylistId - ID único del estilista
   * @returns Promise que resuelve con un array de asignaciones activas del estilista
   */
  findActiveOfferings(stylistId: string): Promise<StylistService[]>;

  /**
   * Busca todos los estilistas que están ofreciendo activamente un servicio específico
   * @param serviceId - ID único del servicio
   * @returns Promise que resuelve con un array de asignaciones activas para el servicio
   */
  findStylistsOfferingService(serviceId: string): Promise<StylistService[]>;

  /**
   * Guarda una nueva asignación estilista-servicio en el sistema
   * @param stylistService - Entidad de asignación a guardar
   * @returns Promise que resuelve con la asignación guardada
   */
  save(stylistService: StylistService): Promise<StylistService>;

  /**
   * Actualiza una asignación estilista-servicio existente en el sistema
   * @param stylistService - Entidad de asignación con los datos actualizados
   * @returns Promise que resuelve con la asignación actualizada
   */
  update(stylistService: StylistService): Promise<StylistService>;

  /**
   * Elimina una asignación estilista-servicio del sistema de forma permanente
   * @param stylistId - ID único del estilista
   * @param serviceId - ID único del servicio
   * @returns Promise que resuelve cuando la eliminación se completa
   */
  delete(stylistId: string, serviceId: string): Promise<void>;

  /**
   * Verifica si existe una asignación entre un estilista y un servicio específicos
   * @param stylistId - ID único del estilista
   * @param serviceId - ID único del servicio
   * @returns Promise que resuelve con true si existe la asignación, false en caso contrario
   */
  existsAssignment(stylistId: string, serviceId: string): Promise<boolean>;
}
