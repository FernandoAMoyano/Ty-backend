/**
 * DTO para actualizar un pago
 * @description Contiene los datos que pueden ser actualizados en un pago pendiente
 */
export interface UpdatePaymentDto {
  /**
   * Nuevo monto del pago (opcional)
   * @example 175.50
   */
  amount?: number;
}
