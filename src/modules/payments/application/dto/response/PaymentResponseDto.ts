import { PaymentStatusEnum, PaymentMethodEnum } from '../../../domain/entities/Payment';

/**
 * DTO de respuesta para un pago
 * @description Representa la estructura de datos de un pago en las respuestas de la API
 */
export interface PaymentResponseDto {
  /**
   * ID único del pago
   */
  id: string;

  /**
   * Monto del pago
   */
  amount: number;

  /**
   * Estado actual del pago
   */
  status: PaymentStatusEnum;

  /**
   * Método de pago utilizado (null si está pendiente)
   */
  method: PaymentMethodEnum | null;

  /**
   * Fecha en que se procesó el pago (null si está pendiente)
   */
  paymentDate: Date | null;

  /**
   * ID de la cita asociada
   */
  appointmentId: string;

  /**
   * Fecha de creación del registro
   */
  createdAt: Date;

  /**
   * Fecha de última actualización
   */
  updatedAt: Date;
}
