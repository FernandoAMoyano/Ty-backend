import { Payment } from '../../domain/entities/Payment';
import { IPaymentRepository } from '../../domain/repositories/IPaymentRepository';
import { RefundPaymentDto } from '../dto/request/RefundPaymentDto';
import { PaymentResponseDto } from '../dto/response/PaymentResponseDto';
import { NotFoundError } from '../../../../shared/exceptions/NotFoundError';
import { BusinessRuleError } from '../../../../shared/exceptions/BusinessRuleError';

/**
 * Caso de uso para reembolsar un pago
 * @description Marca un pago completado como reembolsado
 */
export class RefundPayment {
  constructor(private paymentRepository: IPaymentRepository) {}

  /**
   * Ejecuta el caso de uso
   * @param dto - Datos para reembolsar el pago
   * @returns El pago reembolsado
   * @throws NotFoundError si el pago no existe
   * @throws BusinessRuleError si el pago no puede ser reembolsado
   */
  async execute(dto: RefundPaymentDto): Promise<PaymentResponseDto> {
    const payment = await this.paymentRepository.findById(dto.paymentId);

    if (!payment) {
      throw new NotFoundError('Payment', dto.paymentId);
    }

    if (!payment.isCompleted) {
      throw new BusinessRuleError('Solo se pueden reembolsar pagos completados');
    }

    // Marcar como reembolsado
    payment.refund();

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
