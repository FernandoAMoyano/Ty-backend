import { NotificationTypeEnum } from '../../../domain/entities/Notification';

/**
 * DTO para la creación de una nueva notificación
 * @description Contiene los datos necesarios para crear una notificación en el sistema
 */
export interface CreateNotificationDto {
  /**
   * Tipo de notificación
   * @example 'APPOINTMENT_CONFIRMATION'
   */
  type: NotificationTypeEnum;

  /**
   * Mensaje de la notificación
   * @example 'Tu cita ha sido confirmada para el 15 de enero a las 10:00'
   */
  message: string;

  /**
   * ID del usuario destinatario de la notificación
   */
  userId: string;

  /**
   * Datos adicionales relacionados con la notificación (opcional)
   * @description Puede contener appointmentId, serviceId, etc.
   */
  metadata?: {
    appointmentId?: string;
    serviceId?: string;
    stylistId?: string;
    [key: string]: string | undefined;
  };
}
