import { NotificationRepository } from '../../domain/repositories/NotificationRepository';
import { NotificationStatusRepository } from '../../domain/repositories/NotificationStatusRepository';
import { NotificationStatusEnum } from '../../domain/entities/NotificationStatus';
import { GetNotificationsFilterDto } from '../dto/request/GetNotificationsFilterDto';
import { NotificationDto, NotificationListDto } from '../dto/response/NotificationDto';
import { Notification } from '../../domain/entities/Notification';
import { ValidationError } from '../../../../shared/exceptions/ValidationError';

/**
 * Caso de uso para obtener las notificaciones de un usuario
 * @description Maneja la consulta de notificaciones con filtros y paginación
 */
export class GetUserNotifications {
  constructor(
    private notificationRepository: NotificationRepository,
    private notificationStatusRepository: NotificationStatusRepository,
  ) {}

  /**
   * Ejecuta el caso de uso para obtener las notificaciones de un usuario
   * @param userId - ID del usuario
   * @param filters - Filtros opcionales de búsqueda
   * @returns Promise con la lista paginada de notificaciones
   * @throws ValidationError si el userId no es válido
   */
  async execute(userId: string, filters?: GetNotificationsFilterDto): Promise<NotificationListDto> {
    // 1. Validar userId
    this.validateUserId(userId);

    // 2. Configurar paginación
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const offset = (page - 1) * limit;

    // 3. Obtener notificaciones
    let notifications: Notification[];

    if (filters?.unreadOnly) {
      // Obtener el estado READ para excluirlo
      const readStatus = await this.notificationStatusRepository.findByName(
        NotificationStatusEnum.READ,
      );
      
      if (readStatus) {
        // Obtener todas las notificaciones y filtrar las no leídas
        const allNotifications = await this.notificationRepository.findByUserId(userId);
        notifications = allNotifications.filter(n => n.statusId !== readStatus.id);
      } else {
        notifications = await this.notificationRepository.findByUserId(userId);
      }
    } else if (filters?.type) {
      notifications = await this.notificationRepository.findByUserIdAndType(userId, filters.type);
    } else {
      notifications = await this.notificationRepository.findByUserIdPaginated(userId, limit, offset);
    }

    // 4. Obtener total para paginación
    const total = await this.notificationRepository.countByUserId(userId);

    // 5. Obtener estados para enriquecer respuesta
    const readStatus = await this.notificationStatusRepository.findByName(NotificationStatusEnum.READ);

    // 6. Mapear a DTOs
    const notificationDtos = notifications.map(n => this.mapToDto(n, readStatus?.id));

    // 7. Calcular metadata de paginación
    const totalPages = Math.ceil(total / limit);

    return {
      notifications: notificationDtos,
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };
  }

  /**
   * Valida el ID del usuario
   * @param userId - ID a validar
   * @throws ValidationError si el ID no es válido
   */
  private validateUserId(userId: string): void {
    if (!userId || userId.trim().length === 0) {
      throw new ValidationError('User ID is required');
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      throw new ValidationError('User ID must be a valid UUID');
    }
  }

  /**
   * Mapea una entidad Notification a su DTO de respuesta
   * @param notification - Entidad de notificación
   * @param readStatusId - ID del estado READ para determinar si está leída
   * @returns DTO de notificación para respuesta
   */
  private mapToDto(notification: Notification, readStatusId?: string): NotificationDto {
    return {
      id: notification.id,
      type: notification.type,
      message: notification.message,
      userId: notification.userId,
      statusId: notification.statusId,
      sentAt: notification.sentAt?.toISOString(),
      createdAt: notification.createdAt.toISOString(),
      isRead: readStatusId ? notification.statusId === readStatusId : undefined,
    };
  }
}
