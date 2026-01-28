/**
 * DTO para reembolsar un pago
 * @description Contiene los datos necesarios para procesar un reembolso
 */
export interface RefundPaymentDto {
  /**
   * ID del pago a reembolsar
   */
  paymentId: string;

  /**
   * Razón del reembolso (opcional)
   * @example 'Cliente canceló la cita'
   */
  reason?: string;
}
