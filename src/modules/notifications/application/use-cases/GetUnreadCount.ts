import { INotificationRepository } from '../../domain/repositories/INotificationRepository';
import { INotificationStatusRepository } from '../../domain/repositories/INotificationStatusRepository';
import { NotificationStatusEnum } from '../../domain/entities/NotificationStatus';
import { UnreadCountDto } from '../dto/response/NotificationDto';
import { assertValidUuid } from '../../../../shared/utils/validateUuid';

/**
 * Caso de uso para obtener el conteo de notificaciones no leídas de un usuario
 * @description Retorna la cantidad de notificaciones pendientes de lectura
 */
export class GetUnreadCount {
  constructor(
    private notificationRepository: INotificationRepository,
    private notificationStatusRepository: INotificationStatusRepository,
  ) {}

  /**
   * Ejecuta el caso de uso para obtener el conteo de notificaciones no leídas
   * @param userId - ID del usuario
   * @returns Promise con el conteo de notificaciones no leídas
   * @throws ValidationError si el userId no es válido
   */
  async execute(userId: string): Promise<UnreadCountDto> {
    // 1. Validar userId
    this.validateUserId(userId);

    // 2. Obtener el estado READ
    const readStatus = await this.notificationStatusRepository.findByName(
      NotificationStatusEnum.READ,
    );

    if (!readStatus) {
      // Si no existe el estado READ, todas las notificaciones son "no leídas"
      return { unreadCount: await this.notificationRepository.countByUserId(userId) };
    }

    // 3. Obtener notificaciones y contar las no leídas en memoria
    const allNotifications = await this.notificationRepository.findByUserId(userId);
    const unreadCount = allNotifications.filter((n) => n.statusId !== readStatus.id).length;

    return { unreadCount };
  }

  /**
   * Valida el ID del usuario
   * @param userId - ID a validar
   * @throws ValidationError si el ID no es válido
   */
  private validateUserId(userId: string): void {
    assertValidUuid(userId, 'User ID');
  }
}
