/**
 * DTO para la creación de un nuevo pago
 * @description Contiene los datos necesarios para crear un pago en el sistema
 */
export interface CreatePaymentDto {
  /**
   * Monto del pago
   * @example 150.00
   */
  amount: number;

  /**
   * ID de la cita asociada al pago
   */
  appointmentId: string;
}
