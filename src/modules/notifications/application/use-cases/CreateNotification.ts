import { Notification, NotificationTypeEnum } from '../../domain/entities/Notification';
import { NotificationRepository } from '../../domain/repositories/NotificationRepository';
import { NotificationStatusRepository } from '../../domain/repositories/NotificationStatusRepository';
import { NotificationStatusEnum } from '../../domain/entities/NotificationStatus';
import { CreateNotificationDto } from '../dto/request/CreateNotificationDto';
import { NotificationDto } from '../dto/response/NotificationDto';
import { ValidationError } from '../../../../shared/exceptions/ValidationError';
import { NotFoundError } from '../../../../shared/exceptions/NotFoundError';

/**
 * Caso de uso para crear una nueva notificación
 * @description Maneja la creación de notificaciones con validaciones de negocio
 */
export class CreateNotification {
  constructor(
    private notificationRepository: NotificationRepository,
    private notificationStatusRepository: NotificationStatusRepository,
  ) {}

  /**
   * Ejecuta el caso de uso para crear una notificación
   * @param dto - Datos de la notificación a crear
   * @returns Promise con el DTO de la notificación creada
   * @throws ValidationError si los datos no son válidos
   * @throws NotFoundError si el estado inicial no existe
   */
  async execute(dto: CreateNotificationDto): Promise<NotificationDto> {
    // 1. Validar datos de entrada
    this.validateInput(dto);

    // 2. Obtener el estado inicial (PENDING)
    const pendingStatus = await this.getPendingStatus();

    // 3. Crear la entidad de notificación
    const notification = Notification.create(
      dto.type,
      dto.message,
      dto.userId,
      pendingStatus.id,
    );

    // 4. Guardar la notificación
    const savedNotification = await this.notificationRepository.save(notification);

    // 5. Mapear a DTO de respuesta
    return this.mapToDto(savedNotification);
  }

  /**
   * Valida los datos de entrada
   * @param dto - DTO a validar
   * @throws ValidationError si los datos son inválidos
   */
  private validateInput(dto: CreateNotificationDto): void {
    if (!dto.type) {
      throw new ValidationError('Notification type is required');
    }

    if (!Object.values(NotificationTypeEnum).includes(dto.type)) {
      throw new ValidationError(
        `Invalid notification type. Must be one of: ${Object.values(NotificationTypeEnum).join(', ')}`,
      );
    }

    if (!dto.message || dto.message.trim().length === 0) {
      throw new ValidationError('Notification message is required');
    }

    if (dto.message.length > 1000) {
      throw new ValidationError('Notification message is too long (max 1000 characters)');
    }

    if (!dto.userId || dto.userId.trim().length === 0) {
      throw new ValidationError('User ID is required');
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(dto.userId)) {
      throw new ValidationError('User ID must be a valid UUID');
    }
  }

  /**
   * Obtiene el estado PENDING de la base de datos
   * @returns Estado PENDING
   * @throws NotFoundError si no existe el estado
   */
  private async getPendingStatus() {
    const pendingStatus = await this.notificationStatusRepository.findByName(
      NotificationStatusEnum.PENDING,
    );

    if (!pendingStatus) {
      throw new NotFoundError('NotificationStatus', NotificationStatusEnum.PENDING);
    }

    return pendingStatus;
  }

  /**
   * Mapea una entidad Notification a su DTO de respuesta
   * @param notification - Entidad de notificación
   * @returns DTO de notificación para respuesta
   */
  private mapToDto(notification: Notification): NotificationDto {
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
}
