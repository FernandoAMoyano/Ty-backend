import { INotificationRepository } from '../../domain/repositories/INotificationRepository';
import { INotificationStatusRepository } from '../../domain/repositories/INotificationStatusRepository';
import { NotificationStatusEnum } from '../../domain/entities/NotificationStatus';
import { NotFoundError } from '../../../../shared/exceptions/NotFoundError';
import { assertValidUuid } from '../../../../shared/utils/validateUuid';

/**
 * Caso de uso para marcar TODAS las notificaciones de un usuario como leídas
 * @description A diferencia de MarkNotificationAsRead (que opera sobre una lista acotada
 * de IDs), este caso de uso actualiza directamente en la base de datos todas las
 * notificaciones del usuario cuyo estado no sea READ, sin límite de cantidad (F10:
 * el enfoque anterior en el controller paginaba con un límite de 1000 notificaciones,
 * dejando "mark all" incompleto para usuarios con más notificaciones que eso)
 */
export class MarkAllNotificationsAsRead {
  constructor(
    private notificationRepository: INotificationRepository,
    private notificationStatusRepository: INotificationStatusRepository,
  ) {}

  /**
   * Ejecuta el caso de uso
   * @param requesterId - ID del usuario cuyas notificaciones se marcarán como leídas
   * @returns Promise con el número de notificaciones actualizadas
   * @throws ValidationError si el requesterId no es un UUID válido
   * @throws NotFoundError si el estado READ no existe
   */
  async execute(requesterId: string): Promise<{ updatedCount: number }> {
    this.validateUuid(requesterId, 'Requester ID');

    const readStatus = await this.getReadStatus();

    const updatedCount = await this.notificationRepository.updateStatusByUserId(
      requesterId,
      readStatus.id,
      readStatus.id,
    );

    return { updatedCount };
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

  /**
   * Obtiene el estado READ de la base de datos
   * @returns Estado READ
   * @throws NotFoundError si no existe el estado
   */
  private async getReadStatus() {
    const readStatus = await this.notificationStatusRepository.findByName(
      NotificationStatusEnum.READ,
    );

    if (!readStatus) {
      throw new NotFoundError('NotificationStatus', NotificationStatusEnum.READ);
    }

    return readStatus;
  }
}
