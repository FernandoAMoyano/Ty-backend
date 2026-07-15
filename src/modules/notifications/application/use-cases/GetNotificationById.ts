import { INotificationRepository } from '../../domain/repositories/INotificationRepository';
import { NotificationDto } from '../dto/response/NotificationDto';
import { NotFoundError } from '../../../../shared/exceptions/NotFoundError';
import { ForbiddenError } from '../../../../shared/exceptions/ForbiddenError';
import { assertValidUuid } from '../../../../shared/utils/validateUuid';

/**
 * Caso de uso para obtener una notificación por su ID
 * @description Maneja la consulta de una notificación específica con validación de permisos
 */
export class GetNotificationById {
  constructor(private notificationRepository: INotificationRepository) {}

  /**
   * Ejecuta el caso de uso para obtener una notificación por ID
   * @param notificationId - ID de la notificación
   * @param requesterId - ID del usuario que realiza la consulta
   * @returns Promise con el DTO de la notificación
   * @throws ValidationError si los IDs no son válidos
   * @throws NotFoundError si la notificación no existe
   * @throws ForbiddenError si el usuario no tiene permiso
   */
  async execute(notificationId: string, requesterId: string): Promise<NotificationDto> {
    // 1. Validar IDs
    this.validateUuid(notificationId, 'Notification ID');
    this.validateUuid(requesterId, 'Requester ID');

    // 2. Buscar la notificación
    const notification = await this.notificationRepository.findById(notificationId);

    if (!notification) {
      throw new NotFoundError('Notification', notificationId);
    }

    // 3. Validar permisos (solo el propietario puede ver su notificación)
    if (notification.userId !== requesterId) {
      throw new ForbiddenError('You do not have permission to access this notification');
    }

    // 4. Mapear a DTO
    return {
      id: notification.id,
      type: notification.type,
      message: notification.message,
      userId: notification.userId,
      statusId: notification.statusId,
      sentAt: notification.sentAt?.toISOString(),
      createdAt: notification.createdAt.toISOString(),
    };
  }

  /**
   * Valida que un string sea un UUID válido
   * @param value - Valor a validar
   * @param fieldName - Nombre del campo para el mensaje de error
   * @throws ValidationError si no es un UUID válido
   */
  private validateUuid(value: string, fieldName: string): void {
    assertValidUuid(value, fieldName);
  }
}
