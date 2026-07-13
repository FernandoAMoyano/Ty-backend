import { INotificationRepository } from '../../domain/repositories/INotificationRepository';
import { INotificationStatusRepository } from '../../domain/repositories/INotificationStatusRepository';
import { NotificationStatusEnum } from '../../domain/entities/NotificationStatus';
import { GetNotificationsFilterDto } from '../dto/request/GetNotificationsFilterDto';
import { NotificationDto, NotificationListDto } from '../dto/response/NotificationDto';
import { Notification, NotificationTypeEnum } from '../../domain/entities/Notification';
import { assertValidUuid } from '../../../../shared/utils/validateUuid';

/**
 * Caso de uso para obtener las notificaciones de un usuario
 * @description Maneja la consulta de notificaciones con filtros y paginación
 */
export class GetUserNotifications {
  constructor(
    private notificationRepository: INotificationRepository,
    private notificationStatusRepository: INotificationStatusRepository,
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

    // 3. Resolver el estado READ una sola vez (se usa para enriquecer la respuesta y, si
    // corresponde, para el filtro unreadOnly como "status distinto de READ")
    const readStatus = await this.notificationStatusRepository.findByName(NotificationStatusEnum.READ);

    // 4. Construir filtros combinables (unreadOnly y type ya no son excluyentes) y
    // aplicar siempre paginación real en el repositorio, no en memoria
    const repositoryFilters: { excludeStatusId?: string; type?: NotificationTypeEnum } = {};
    if (filters?.unreadOnly && readStatus) {
      repositoryFilters.excludeStatusId = readStatus.id;
    }
    if (filters?.type) {
      repositoryFilters.type = filters.type;
    }

    const notifications = await this.notificationRepository.findByUserIdFiltered(
      userId,
      repositoryFilters,
      limit,
      offset,
    );

    // 5. Obtener el total reflejando los mismos filtros aplicados
    const total = await this.notificationRepository.countByUserIdFiltered(userId, repositoryFilters);

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
    assertValidUuid(userId, 'User ID');
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
