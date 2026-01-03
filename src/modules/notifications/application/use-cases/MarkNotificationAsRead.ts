import { NotificationRepository } from '../../domain/repositories/NotificationRepository';
import { NotificationStatusRepository } from '../../domain/repositories/NotificationStatusRepository';
import { NotificationStatusEnum } from '../../domain/entities/NotificationStatus';
import { MarkAsReadDto } from '../dto/request/MarkAsReadDto';
import { NotificationDto } from '../dto/response/NotificationDto';
import { ValidationError } from '../../../../shared/exceptions/ValidationError';
import { NotFoundError } from '../../../../shared/exceptions/NotFoundError';
import { BusinessRuleError } from '../../../../shared/exceptions/BusinessRuleError';

/**
 * Caso de uso para marcar notificaciones como leídas
 * @description Maneja la actualización del estado de notificaciones a READ
 */
export class MarkNotificationAsRead {
  constructor(
    private notificationRepository: NotificationRepository,
    private notificationStatusRepository: NotificationStatusRepository,
  ) {}

  /**
   * Ejecuta el caso de uso para marcar una o múltiples notificaciones como leídas
   * @param dto - DTO con los IDs de notificaciones a marcar
   * @param requesterId - ID del usuario que realiza la acción
   * @returns Promise con el número de notificaciones actualizadas
   * @throws ValidationError si los datos no son válidos
   * @throws NotFoundError si la notificación o estado no existe
   * @throws BusinessRuleError si el usuario no tiene permiso
   */
  async execute(dto: MarkAsReadDto, requesterId: string): Promise<{ updatedCount: number }> {
    // 1. Validar datos de entrada
    this.validateInput(dto, requesterId);

    // 2. Determinar qué IDs procesar
    const notificationIds = this.getNotificationIds(dto);

    // 3. Obtener el estado READ
    const readStatus = await this.getReadStatus();

    // 4. Validar que las notificaciones existen y pertenecen al usuario
    await this.validateNotificationsOwnership(notificationIds, requesterId);

    // 5. Actualizar el estado de las notificaciones
    const updatedCount = await this.notificationRepository.updateManyStatus(
      notificationIds,
      readStatus.id,
    );

    return { updatedCount };
  }

  /**
   * Marca una única notificación como leída y retorna el DTO actualizado
   * @param notificationId - ID de la notificación
   * @param requesterId - ID del usuario que realiza la acción
   * @returns Promise con el DTO de la notificación actualizada
   */
  async executeSingle(notificationId: string, requesterId: string): Promise<NotificationDto> {
    // 1. Validar IDs
    this.validateUuid(notificationId, 'Notification ID');
    this.validateUuid(requesterId, 'Requester ID');

    // 2. Buscar la notificación
    const notification = await this.notificationRepository.findById(notificationId);
    if (!notification) {
      throw new NotFoundError('Notification', notificationId);
    }

    // 3. Validar que la notificación pertenece al usuario
    if (notification.userId !== requesterId) {
      throw new BusinessRuleError('You do not have permission to access this notification');
    }

    // 4. Obtener el estado READ
    const readStatus = await this.getReadStatus();

    // 5. Verificar si ya está leída
    if (notification.statusId === readStatus.id) {
      // Ya está leída, retornar sin cambios
      return this.mapToDto(notification, true);
    }

    // 6. Actualizar el estado
    notification.updateStatus(readStatus.id);
    const updatedNotification = await this.notificationRepository.update(notification);

    return this.mapToDto(updatedNotification, true);
  }

  /**
   * Valida los datos de entrada
   * @param dto - DTO a validar
   * @param requesterId - ID del solicitante
   * @throws ValidationError si los datos son inválidos
   */
  private validateInput(dto: MarkAsReadDto, requesterId: string): void {
    this.validateUuid(requesterId, 'Requester ID');

    const hasNotificationId = dto.notificationId && dto.notificationId.trim().length > 0;
    const hasNotificationIds = dto.notificationIds && dto.notificationIds.length > 0;

    if (!hasNotificationId && !hasNotificationIds) {
      throw new ValidationError(
        'At least one notification ID is required (use notificationId or notificationIds)',
      );
    }

    if (dto.notificationId) {
      this.validateUuid(dto.notificationId, 'Notification ID');
    }

    if (dto.notificationIds) {
      dto.notificationIds.forEach((id, index) => {
        this.validateUuid(id, `Notification ID at index ${index}`);
      });
    }
  }

  /**
   * Valida que un string sea un UUID válido
   * @param value - Valor a validar
   * @param fieldName - Nombre del campo para el mensaje de error
   * @throws ValidationError si no es un UUID válido
   */
  private validateUuid(value: string, fieldName: string): void {
    if (!value || value.trim().length === 0) {
      throw new ValidationError(`${fieldName} is required`);
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(value)) {
      throw new ValidationError(`${fieldName} must be a valid UUID`);
    }
  }

  /**
   * Extrae los IDs de notificaciones del DTO
   * @param dto - DTO con los IDs
   * @returns Array de IDs de notificaciones
   */
  private getNotificationIds(dto: MarkAsReadDto): string[] {
    if (dto.notificationIds && dto.notificationIds.length > 0) {
      return dto.notificationIds;
    }
    if (dto.notificationId) {
      return [dto.notificationId];
    }
    return [];
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

  /**
   * Valida que todas las notificaciones existan y pertenezcan al usuario
   * @param notificationIds - IDs de notificaciones a validar
   * @param userId - ID del usuario propietario esperado
   * @throws NotFoundError si alguna notificación no existe
   * @throws BusinessRuleError si alguna notificación no pertenece al usuario
   */
  private async validateNotificationsOwnership(
    notificationIds: string[],
    userId: string,
  ): Promise<void> {
    for (const id of notificationIds) {
      const notification = await this.notificationRepository.findById(id);
      
      if (!notification) {
        throw new NotFoundError('Notification', id);
      }
      
      if (notification.userId !== userId) {
        throw new BusinessRuleError(
          `You do not have permission to access notification ${id}`,
        );
      }
    }
  }

  /**
   * Mapea una entidad Notification a su DTO de respuesta
   * @param notification - Entidad de notificación
   * @param isRead - Indica si está leída
   * @returns DTO de notificación para respuesta
   */
  private mapToDto(notification: any, isRead: boolean): NotificationDto {
    return {
      id: notification.id,
      type: notification.type,
      message: notification.message,
      userId: notification.userId,
      statusId: notification.statusId,
      sentAt: notification.sentAt?.toISOString(),
      createdAt: notification.createdAt.toISOString(),
      isRead,
    };
  }
}
