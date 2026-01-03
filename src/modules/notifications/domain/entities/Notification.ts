import { generateUuid } from '../../../../shared/utils/uuid';
import { ValidationError } from '../../../../shared/exceptions/ValidationError';

/**
 * Enumeración de tipos de notificación
 * @description Corresponde al enum NotificationType de Prisma
 */
export enum NotificationTypeEnum {
  /** Confirmación de cita */
  APPOINTMENT_CONFIRMATION = 'APPOINTMENT_CONFIRMATION',
  /** Recordatorio de cita próxima */
  APPOINTMENT_REMINDER = 'APPOINTMENT_REMINDER',
  /** Notificación de cancelación de cita */
  APPOINTMENT_CANCELLATION = 'APPOINTMENT_CANCELLATION',
  /** Notificación promocional */
  PROMOTIONAL = 'PROMOTIONAL',
  /** Notificación del sistema */
  SYSTEM = 'SYSTEM',
}

/**
 * Propiedades requeridas para crear una notificación
 */
interface NotificationProps {
  id?: string;
  type: NotificationTypeEnum;
  message: string;
  userId: string;
  statusId: string;
  sentAt?: Date;
  createdAt?: Date;
}

/**
 * Entidad de dominio que representa una notificación del sistema
 * @description Maneja las notificaciones enviadas a usuarios incluyendo
 * confirmaciones de citas, recordatorios, cancelaciones y mensajes promocionales
 */
export class Notification {
  public readonly id: string;
  public type: NotificationTypeEnum;
  public message: string;
  public userId: string;
  public statusId: string;
  public sentAt?: Date;
  public readonly createdAt: Date;

  constructor(props: NotificationProps) {
    this.id = props.id || generateUuid();
    this.type = props.type;
    this.message = props.message;
    this.userId = props.userId;
    this.statusId = props.statusId;
    this.sentAt = props.sentAt;
    this.createdAt = props.createdAt || new Date();

    this.validate();
  }

  /**
   * Crea una nueva instancia de notificación con validaciones automáticas
   * @param type - Tipo de notificación (del enum NotificationTypeEnum)
   * @param message - Contenido del mensaje de la notificación
   * @param userId - ID del usuario destinatario
   * @param statusId - ID del estado inicial de la notificación
   * @returns Nueva instancia de Notification
   * @throws ValidationError si los datos no son válidos
   */
  static create(
    type: NotificationTypeEnum,
    message: string,
    userId: string,
    statusId: string,
  ): Notification {
    return new Notification({
      type,
      message,
      userId,
      statusId,
    });
  }

  /**
   * Reconstruye una instancia de notificación desde datos de persistencia
   * @param data - Datos de la notificación desde la base de datos
   * @returns Instancia de Notification desde persistencia
   */
  static fromPersistence(data: {
    id: string;
    type: string;
    message: string;
    userId: string;
    statusId: string;
    sentAt: Date | null;
    createdAt: Date;
  }): Notification {
    return new Notification({
      id: data.id,
      type: data.type as NotificationTypeEnum,
      message: data.message,
      userId: data.userId,
      statusId: data.statusId,
      sentAt: data.sentAt || undefined,
      createdAt: data.createdAt,
    });
  }

  /**
   * Ejecuta todas las validaciones necesarias para la notificación
   * @throws ValidationError si alguna validación falla
   */
  private validate(): void {
    if (!this.type) {
      throw new ValidationError('Notification type is required');
    }

    if (!Object.values(NotificationTypeEnum).includes(this.type)) {
      throw new ValidationError(
        `Invalid notification type. Must be one of: ${Object.values(NotificationTypeEnum).join(', ')}`,
      );
    }

    if (!this.message || this.message.trim().length === 0) {
      throw new ValidationError('Notification message cannot be empty');
    }

    if (this.message.length > 1000) {
      throw new ValidationError('Notification message is too long (max 1000 characters)');
    }

    if (!this.userId || this.userId.trim().length === 0) {
      throw new ValidationError('User ID is required for notification');
    }

    if (!this.statusId || this.statusId.trim().length === 0) {
      throw new ValidationError('Status ID is required for notification');
    }
  }

  /**
   * Marca la notificación como enviada
   * @description Establece la fecha de envío al momento actual
   */
  markAsSent(): void {
    this.sentAt = new Date();
  }

  /**
   * Actualiza el estado de la notificación
   * @param newStatusId - ID del nuevo estado
   */
  updateStatus(newStatusId: string): void {
    if (!newStatusId || newStatusId.trim().length === 0) {
      throw new ValidationError('New status ID cannot be empty');
    }
    this.statusId = newStatusId;
  }

  /**
   * Verifica si la notificación ha sido enviada
   * @returns true si la notificación tiene fecha de envío, false en caso contrario
   */
  isSent(): boolean {
    return this.sentAt !== undefined && this.sentAt !== null;
  }

  /**
   * Verifica si la notificación es de tipo relacionado con citas
   * @returns true si es una notificación de cita (confirmación, recordatorio, cancelación)
   */
  isAppointmentRelated(): boolean {
    return [
      NotificationTypeEnum.APPOINTMENT_CONFIRMATION,
      NotificationTypeEnum.APPOINTMENT_REMINDER,
      NotificationTypeEnum.APPOINTMENT_CANCELLATION,
    ].includes(this.type);
  }

  /**
   * Convierte la entidad a formato de persistencia para guardar en base de datos
   * @returns Objeto plano con todas las propiedades de la notificación
   */
  toPersistence() {
    return {
      id: this.id,
      type: this.type,
      message: this.message,
      userId: this.userId,
      statusId: this.statusId,
      sentAt: this.sentAt || null,
      createdAt: this.createdAt,
    };
  }
}
