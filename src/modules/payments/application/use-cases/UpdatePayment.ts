import { Payment } from '../../domain/entities/Payment';
import { IPaymentRepository } from '../../domain/repositories/IPaymentRepository';
import { UpdatePaymentDto } from '../dto/request/UpdatePaymentDto';
import { PaymentResponseDto } from '../dto/response/PaymentResponseDto';
import { NotFoundError } from '../../../../shared/exceptions/NotFoundError';
import { BusinessRuleError } from '../../../../shared/exceptions/BusinessRuleError';

/**
 * Caso de uso para actualizar un pago
 * @description Actualiza los datos de un pago pendiente
 */
export class UpdatePayment {
  constructor(private paymentRepository: IPaymentRepository) {}

  /**
   * Ejecuta el caso de uso
   * @param paymentId - ID del pago a actualizar
   * @param dto - Datos a actualizar
   * @returns El pago actualizado
   * @throws NotFoundError si el pago no existe
   * @throws BusinessRuleError si el pago no puede ser actualizado
   */
  async execute(paymentId: string, dto: UpdatePaymentDto): Promise<PaymentResponseDto> {
    const payment = await this.paymentRepository.findById(paymentId);

    if (!payment) {
      throw new NotFoundError('Payment', paymentId);
    }

    if (!payment.isPending) {
      throw new BusinessRuleError('Solo se pueden actualizar pagos pendientes');
    }

    // Actualizar monto si se proporciona
    if (dto.amount !== undefined) {
      if (dto.amount <= 0) {
        throw new BusinessRuleError('El monto debe ser mayor a 0');
      }
      payment.updateAmount(dto.amount);
    }

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
