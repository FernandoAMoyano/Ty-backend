import { Payment } from '../../domain/entities/Payment';
import { IPaymentRepository } from '../../domain/repositories/IPaymentRepository';
import { PaymentResponseDto } from '../dto/response/PaymentResponseDto';

/**
 * Caso de uso para obtener pagos por cita
 * @description Busca todos los pagos asociados a una cita específica
 */
export class GetPaymentsByAppointment {
  constructor(private paymentRepository: IPaymentRepository) {}

  /**
   * Ejecuta el caso de uso
   * @param appointmentId - ID de la cita
   * @returns Lista de pagos de la cita
   */
  async execute(appointmentId: string): Promise<PaymentResponseDto[]> {
    const payments = await this.paymentRepository.findByAppointmentId(appointmentId);

    return payments.map(payment => this.toResponseDto(payment));
  }

  private toResponseDto(payment: Payment): PaymentResponseDto {
    return {
      id: payment.id,
      amount: payment.amount,
      status: payment.status,
      method: payment.method,
      paymentDate: payment.paymentDate,
      appointmentId: payment.appointmentId,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
    };
  }
}
