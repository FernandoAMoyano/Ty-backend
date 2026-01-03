import { NotificationRepository } from '../../domain/repositories/NotificationRepository';
import { NotificationStatusRepository } from '../../domain/repositories/NotificationStatusRepository';
import { NotificationStatusEnum } from '../../domain/entities/NotificationStatus';
import { UnreadCountDto } from '../dto/response/NotificationDto';
import { ValidationError } from '../../../../shared/exceptions/ValidationError';

/**
 * Caso de uso para obtener el conteo de notificaciones no leídas de un usuario
 * @description Retorna la cantidad de notificaciones pendientes de lectura
 */
export class GetUnreadCount {
  constructor(
    private notificationRepository: NotificationRepository,
    private notificationStatusRepository: NotificationStatusRepository,
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

    // 3. Contar notificaciones no leídas
    let unreadCount = 0;

    if (readStatus) {
      // Obtener todas las notificaciones del usuario y contar las que no están en READ
      const allNotifications = await this.notificationRepository.findByUserId(userId);
      unreadCount = allNotifications.filter(n => n.statusId !== readStatus.id).length;
    } else {
      // Si no existe el estado READ, todas las notificaciones son "no leídas"
      unreadCount = await this.notificationRepository.countByUserId(userId);
    }

    return { unreadCount };
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
}
