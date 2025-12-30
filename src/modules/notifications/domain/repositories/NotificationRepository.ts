import { Notification, NotificationTypeEnum } from '../entities/Notification';

/**
 * Interfaz del repositorio para notificaciones
 * @description Define el contrato para operaciones de persistencia de notificaciones
 * siguiendo el patrón Repository de Clean Architecture
 */
export interface NotificationRepository {
  /**
   * Busca una notificación por su ID único
   * @param id - ID único de la notificación
   * @returns Promise con la notificación encontrada o null si no existe
   */
  findById(id: string): Promise<Notification | null>;

  /**
   * Obtiene todas las notificaciones de un usuario específico
   * @param userId - ID del usuario
   * @returns Promise con array de notificaciones del usuario
   */
  findByUserId(userId: string): Promise<Notification[]>;

  /**
   * Obtiene las notificaciones de un usuario con paginación
   * @param userId - ID del usuario
   * @param limit - Cantidad máxima de resultados
   * @param offset - Cantidad de resultados a saltar
   * @returns Promise con array de notificaciones paginadas
   */
  findByUserIdPaginated(userId: string, limit: number, offset: number): Promise<Notification[]>;

  /**
   * Obtiene todas las notificaciones de un usuario por estado
   * @param userId - ID del usuario
   * @param statusId - ID del estado de las notificaciones
   * @returns Promise con array de notificaciones filtradas por estado
   */
  findByUserIdAndStatus(userId: string, statusId: string): Promise<Notification[]>;

  /**
   * Obtiene todas las notificaciones de un usuario por tipo
   * @param userId - ID del usuario
   * @param type - Tipo de notificación
   * @returns Promise con array de notificaciones filtradas por tipo
   */
  findByUserIdAndType(userId: string, type: NotificationTypeEnum): Promise<Notification[]>;

  /**
   * Cuenta las notificaciones no leídas de un usuario
   * @param userId - ID del usuario
   * @param unreadStatusId - ID del estado que representa "no leído" (PENDING o SENT)
   * @returns Promise con el conteo de notificaciones no leídas
   */
  countUnreadByUserId(userId: string, unreadStatusId: string): Promise<number>;

  /**
   * Obtiene todas las notificaciones del sistema
   * @returns Promise con array de todas las notificaciones
   */
  findAll(): Promise<Notification[]>;

  /**
   * Guarda una nueva notificación en la base de datos
   * @param notification - Entidad de notificación a guardar
   * @returns Promise con la notificación guardada
   */
  save(notification: Notification): Promise<Notification>;

  /**
   * Guarda múltiples notificaciones en una sola transacción
   * @param notifications - Array de notificaciones a guardar
   * @returns Promise con array de notificaciones guardadas
   */
  saveMany(notifications: Notification[]): Promise<Notification[]>;

  /**
   * Actualiza una notificación existente
   * @param notification - Entidad de notificación con los datos actualizados
   * @returns Promise con la notificación actualizada
   */
  update(notification: Notification): Promise<Notification>;

  /**
   * Actualiza el estado de múltiples notificaciones
   * @param ids - Array de IDs de notificaciones a actualizar
   * @param newStatusId - Nuevo ID de estado
   * @returns Promise con el número de notificaciones actualizadas
   */
  updateManyStatus(ids: string[], newStatusId: string): Promise<number>;

  /**
   * Elimina una notificación por su ID
   * @param id - ID único de la notificación a eliminar
   * @returns Promise que resuelve cuando se completa la eliminación
   */
  delete(id: string): Promise<void>;

  /**
   * Elimina todas las notificaciones de un usuario
   * @param userId - ID del usuario
   * @returns Promise con el número de notificaciones eliminadas
   */
  deleteByUserId(userId: string): Promise<number>;

  /**
   * Verifica si existe una notificación con el ID especificado
   * @param id - ID único de la notificación
   * @returns Promise con true si existe, false en caso contrario
   */
  existsById(id: string): Promise<boolean>;

  /**
   * Cuenta el total de notificaciones de un usuario
   * @param userId - ID del usuario
   * @returns Promise con el conteo total de notificaciones
   */
  countByUserId(userId: string): Promise<number>;
}
