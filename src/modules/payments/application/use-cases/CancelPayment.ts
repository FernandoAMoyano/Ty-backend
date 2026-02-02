import { Payment } from '../../domain/entities/Payment';
import { IPaymentRepository } from '../../domain/repositories/IPaymentRepository';
import { PaymentResponseDto } from '../dto/response/PaymentResponseDto';
import { NotFoundError } from '../../../../shared/exceptions/NotFoundError';
import { BusinessRuleError } from '../../../../shared/exceptions/BusinessRuleError';

/**
 * Caso de uso para cancelar (marcar como fallido) un pago
 * @description Marca un pago pendiente como fallido
 */
export class CancelPayment {
  constructor(private paymentRepository: IPaymentRepository) {}

  /**
   * Ejecuta el caso de uso
   * @param paymentId - ID del pago a cancelar
   * @returns El pago cancelado
   * @throws NotFoundError si el pago no existe
   * @throws BusinessRuleError si el pago no puede ser cancelado
   */
  async execute(paymentId: string): Promise<PaymentResponseDto> {
    const payment = await this.paymentRepository.findById(paymentId);

    if (!payment) {
      throw new NotFoundError('Payment', paymentId);
    }

    if (!payment.isPending) {
      throw new BusinessRuleError('Solo se pueden cancelar pagos pendientes');
    }

    // Marcar como fallido
    payment.markAsFailed();

    // Guardar cambios
    const updatedPayment = await this.paymentRepository.update(payment);

    return this.toResponseDto(updatedPayment);
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
