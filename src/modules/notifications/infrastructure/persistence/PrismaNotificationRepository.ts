import { PrismaClient, NotificationType } from '@prisma/client';
import { Notification, NotificationTypeEnum } from '../../domain/entities/Notification';
import { NotificationRepository } from '../../domain/repositories/NotificationRepository';

/**
 * Implementación del repositorio de notificaciones usando Prisma
 * @description Maneja la persistencia de notificaciones en PostgreSQL
 */
export class PrismaNotificationRepository implements NotificationRepository {
  constructor(private prisma: PrismaClient) {}

  /**
   * Busca una notificación por su ID único
   * @param id - ID único de la notificación
   * @returns Promise con la notificación encontrada o null si no existe
   */
  async findById(id: string): Promise<Notification | null> {
    const notification = await this.prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) return null;

    return this.mapToDomain(notification);
  }

  /**
   * Obtiene todas las notificaciones de un usuario específico
   * @param userId - ID del usuario
   * @returns Promise con array de notificaciones del usuario
   */
  async findByUserId(userId: string): Promise<Notification[]> {
    const notifications = await this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return notifications.map(n => this.mapToDomain(n));
  }

  /**
   * Obtiene las notificaciones de un usuario con paginación
   * @param userId - ID del usuario
   * @param limit - Cantidad máxima de resultados
   * @param offset - Cantidad de resultados a saltar
   * @returns Promise con array de notificaciones paginadas
   */
  async findByUserIdPaginated(
    userId: string,
    limit: number,
    offset: number,
  ): Promise<Notification[]> {
    const notifications = await this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    return notifications.map(n => this.mapToDomain(n));
  }

  /**
   * Obtiene todas las notificaciones de un usuario por estado
   * @param userId - ID del usuario
   * @param statusId - ID del estado de las notificaciones
   * @returns Promise con array de notificaciones filtradas por estado
   */
  async findByUserIdAndStatus(userId: string, statusId: string): Promise<Notification[]> {
    const notifications = await this.prisma.notification.findMany({
      where: { userId, statusId },
      orderBy: { createdAt: 'desc' },
    });

    return notifications.map(n => this.mapToDomain(n));
  }

  /**
   * Obtiene todas las notificaciones de un usuario por tipo
   * @param userId - ID del usuario
   * @param type - Tipo de notificación
   * @returns Promise con array de notificaciones filtradas por tipo
   */
  async findByUserIdAndType(
    userId: string,
    type: NotificationTypeEnum,
  ): Promise<Notification[]> {
    const notifications = await this.prisma.notification.findMany({
      where: {
        userId,
        type: type as NotificationType,
      },
      orderBy: { createdAt: 'desc' },
    });

    return notifications.map(n => this.mapToDomain(n));
  }

  /**
   * Cuenta las notificaciones no leídas de un usuario
   * @param userId - ID del usuario
   * @param unreadStatusId - ID del estado que representa "no leído"
   * @returns Promise con el conteo de notificaciones no leídas
   */
  async countUnreadByUserId(userId: string, unreadStatusId: string): Promise<number> {
    return this.prisma.notification.count({
      where: {
        userId,
        statusId: { not: unreadStatusId },
      },
    });
  }

  /**
   * Obtiene todas las notificaciones del sistema
   * @returns Promise con array de todas las notificaciones
   */
  async findAll(): Promise<Notification[]> {
    const notifications = await this.prisma.notification.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return notifications.map(n => this.mapToDomain(n));
  }

  /**
   * Guarda una nueva notificación en la base de datos
   * @param notification - Entidad de notificación a guardar
   * @returns Promise con la notificación guardada
   */
  async save(notification: Notification): Promise<Notification> {
    const data = notification.toPersistence();

    const savedNotification = await this.prisma.notification.create({
      data: {
        id: data.id,
        type: data.type as NotificationType,
        message: data.message,
        userId: data.userId,
        statusId: data.statusId,
        sentAt: data.sentAt,
        createdAt: data.createdAt,
      },
    });

    return this.mapToDomain(savedNotification);
  }

  /**
   * Guarda múltiples notificaciones en una sola transacción
   * @param notifications - Array de notificaciones a guardar
   * @returns Promise con array de notificaciones guardadas
   */
  async saveMany(notifications: Notification[]): Promise<Notification[]> {
    const data = notifications.map(n => {
      const persistence = n.toPersistence();
      return {
        id: persistence.id,
        type: persistence.type as NotificationType,
        message: persistence.message,
        userId: persistence.userId,
        statusId: persistence.statusId,
        sentAt: persistence.sentAt,
        createdAt: persistence.createdAt,
      };
    });

    await this.prisma.notification.createMany({ data });

    // Recuperar las notificaciones guardadas
    const savedNotifications = await this.prisma.notification.findMany({
      where: {
        id: { in: notifications.map(n => n.id) },
      },
    });

    return savedNotifications.map(n => this.mapToDomain(n));
  }

  /**
   * Actualiza una notificación existente
   * @param notification - Entidad de notificación con los datos actualizados
   * @returns Promise con la notificación actualizada
   */
  async update(notification: Notification): Promise<Notification> {
    const data = notification.toPersistence();

    const updatedNotification = await this.prisma.notification.update({
      where: { id: data.id },
      data: {
        type: data.type as NotificationType,
        message: data.message,
        statusId: data.statusId,
        sentAt: data.sentAt,
      },
    });

    return this.mapToDomain(updatedNotification);
  }

  /**
   * Actualiza el estado de múltiples notificaciones
   * @param ids - Array de IDs de notificaciones a actualizar
   * @param newStatusId - Nuevo ID de estado
   * @returns Promise con el número de notificaciones actualizadas
   */
  async updateManyStatus(ids: string[], newStatusId: string): Promise<number> {
    const result = await this.prisma.notification.updateMany({
      where: {
        id: { in: ids },
      },
      data: {
        statusId: newStatusId,
      },
    });

    return result.count;
  }

  /**
   * Elimina una notificación por su ID
   * @param id - ID único de la notificación a eliminar
   * @returns Promise que resuelve cuando se completa la eliminación
   */
  async delete(id: string): Promise<void> {
    await this.prisma.notification.delete({
      where: { id },
    });
  }

  /**
   * Elimina todas las notificaciones de un usuario
   * @param userId - ID del usuario
   * @returns Promise con el número de notificaciones eliminadas
   */
  async deleteByUserId(userId: string): Promise<number> {
    const result = await this.prisma.notification.deleteMany({
      where: { userId },
    });

    return result.count;
  }

  /**
   * Verifica si existe una notificación con el ID especificado
   * @param id - ID único de la notificación
   * @returns Promise con true si existe, false en caso contrario
   */
  async existsById(id: string): Promise<boolean> {
    const count = await this.prisma.notification.count({
      where: { id },
    });
    return count > 0;
  }

  /**
   * Cuenta el total de notificaciones de un usuario
   * @param userId - ID del usuario
   * @returns Promise con el conteo total de notificaciones
   */
  async countByUserId(userId: string): Promise<number> {
    return this.prisma.notification.count({
      where: { userId },
    });
  }

  /**
   * Mapea un registro de Prisma a la entidad de dominio
   * @param prismaNotification - Registro de Prisma
   * @returns Entidad de dominio Notification
   */
  private mapToDomain(prismaNotification: {
    id: string;
    type: NotificationType;
    message: string;
    userId: string;
    statusId: string;
    sentAt: Date | null;
    createdAt: Date;
  }): Notification {
    return Notification.fromPersistence({
      id: prismaNotification.id,
      type: prismaNotification.type as string,
      message: prismaNotification.message,
      userId: prismaNotification.userId,
      statusId: prismaNotification.statusId,
      sentAt: prismaNotification.sentAt,
      createdAt: prismaNotification.createdAt,
    });
  }
}
