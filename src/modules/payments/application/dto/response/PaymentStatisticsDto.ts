/**
 * DTO de respuesta para estadísticas de pagos
 * @description Estructura de datos con métricas y estadísticas de pagos
 */
export interface PaymentStatisticsDto {
  /**
   * Ingresos totales (solo pagos completados)
   */
  totalRevenue: number;

  /**
   * Cantidad total de pagos en el período
   */
  totalPayments: number;

  /**
   * Cantidad de pagos completados
   */
  completedPayments: number;

  /**
   * Cantidad de pagos pendientes
   */
  pendingPayments: number;

  /**
   * Cantidad de pagos reembolsados
   */
  refundedPayments: number;

  /**
   * Cantidad de pagos fallidos
   */
  failedPayments: number;

  /**
   * Promedio de pago completado
   */
  averagePayment: number;

  /**
   * Distribución de pagos por método
   * @example { "CASH": 10, "CREDIT_CARD": 25, "TRANSFER": 5 }
   */
  paymentsByMethod: Record<string, number>;
}
