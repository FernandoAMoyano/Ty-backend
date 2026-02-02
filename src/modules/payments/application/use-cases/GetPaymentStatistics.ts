import { IPaymentRepository } from '../../domain/repositories/IPaymentRepository';
import { PaymentStatisticsDto } from '../dto/response/PaymentStatisticsDto';

/**
 * Caso de uso para obtener estadísticas de pagos
 * @description Obtiene estadísticas de pagos en un período determinado
 */
export class GetPaymentStatistics {
  constructor(private paymentRepository: IPaymentRepository) {}

  /**
   * Ejecuta el caso de uso
   * @param startDate - Fecha de inicio del período
   * @param endDate - Fecha de fin del período
   * @returns Estadísticas de pagos
   */
  async execute(startDate: Date, endDate: Date): Promise<PaymentStatisticsDto> {
    const statistics = await this.paymentRepository.getStatistics(startDate, endDate);

    return {
      totalRevenue: statistics.totalRevenue,
      totalPayments: statistics.totalPayments,
      completedPayments: statistics.completedPayments,
      pendingPayments: statistics.pendingPayments,
      refundedPayments: statistics.refundedPayments,
      failedPayments: statistics.failedPayments,
      averagePayment: statistics.averagePayment,
      paymentsByMethod: statistics.paymentsByMethod,
    };
  }
}
