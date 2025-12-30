import { NotificationStatus } from '../entities/NotificationStatus';

/**
 * Interfaz del repositorio para estados de notificaciones
 * @description Define el contrato para operaciones de persistencia de estados de notificaciones
 * siguiendo el patrón Repository de Clean Architecture
 */
export interface NotificationStatusRepository {
  /**
   * Busca un estado de notificación por su ID único
   * @param id - ID único del estado
   * @returns Promise con el estado encontrado o null si no existe
   */
  findById(id: string): Promise<NotificationStatus | null>;

  /**
   * Busca un estado de notificación por su nombre
   * @param name - Nombre del estado (ej: 'PENDING', 'SENT', 'READ')
   * @returns Promise con el estado encontrado o null si no existe
   */
  findByName(name: string): Promise<NotificationStatus | null>;

  /**
   * Obtiene todos los estados de notificación disponibles
   * @returns Promise con array de todos los estados
   */
  findAll(): Promise<NotificationStatus[]>;

  /**
   * Guarda un nuevo estado de notificación en la base de datos
   * @param status - Entidad de estado a guardar
   * @returns Promise con el estado guardado
   */
  save(status: NotificationStatus): Promise<NotificationStatus>;

  /**
   * Actualiza un estado de notificación existente
   * @param status - Entidad de estado con los datos actualizados
   * @returns Promise con el estado actualizado
   */
  update(status: NotificationStatus): Promise<NotificationStatus>;

  /**
   * Elimina un estado de notificación por su ID
   * @param id - ID único del estado a eliminar
   * @returns Promise que resuelve cuando se completa la eliminación
   */
  delete(id: string): Promise<void>;

  /**
   * Verifica si existe un estado de notificación con el ID especificado
   * @param id - ID único del estado
   * @returns Promise con true si existe, false en caso contrario
   */
  existsById(id: string): Promise<boolean>;

  /**
   * Verifica si existe un estado de notificación con el nombre especificado
   * @param name - Nombre del estado
   * @returns Promise con true si existe, false en caso contrario
   */
  existsByName(name: string): Promise<boolean>;
}
