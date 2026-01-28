import { PaymentMethodEnum } from '../../../domain/entities/Payment';

/**
 * DTO para procesar (completar) un pago
 * @description Contiene los datos necesarios para marcar un pago como completado
 */
export interface ProcessPaymentDto {
  /**
   * ID del pago a procesar
   */
  paymentId: string;

  /**
   * Método de pago utilizado
   * @example 'CREDIT_CARD'
   */
  method: PaymentMethodEnum;
}
