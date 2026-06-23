import { Payment } from '../../domain/entities/Payment';
import { IPaymentRepository } from '../../domain/repositories/IPaymentRepository';
import { ProcessPaymentDto } from '../dto/request/ProcessPaymentDto';
import { PaymentResponseDto } from '../dto/response/PaymentResponseDto';
import { NotFoundError } from '../../../../shared/exceptions/NotFoundError';
import { BusinessRuleError } from '../../../../shared/exceptions/BusinessRuleError';

/**
 * Caso de uso para procesar (completar) un pago
 * @description Marca un pago como completado con el método de pago utilizado
 */
export class ProcessPayment {
  constructor(private paymentRepository: IPaymentRepository) {}

  /**
   * Ejecuta el caso de uso
   * @param dto - Datos para procesar el pago
   * @returns El pago procesado
   * @throws NotFoundError si el pago no existe
   * @throws BusinessRuleError si el pago no puede ser procesado
   */
  async execute(dto: ProcessPaymentDto): Promise<PaymentResponseDto> {
    const payment = await this.paymentRepository.findById(dto.paymentId);

    if (!payment) {
      throw new NotFoundError('Payment', dto.paymentId);
    }

    if (!payment.isPending) {
      throw new BusinessRuleError('Only pending payments can be processed');
    }

    // Marcar como completado
    payment.markAsCompleted(dto.method);

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
      refundReason: payment.refundReason,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
    };
  }
}
