import { Payment } from '../../domain/entities/Payment';
import { IPaymentRepository } from '../../domain/repositories/IPaymentRepository';
import { IAppointmentRepository } from '../../../appointments/domain/repositories/IAppointmentRepository';
import { RefundPaymentDto } from '../dto/request/RefundPaymentDto';
import { PaymentResponseDto } from '../dto/response/PaymentResponseDto';
import { NotFoundError } from '../../../../shared/exceptions/NotFoundError';
import { BusinessRuleError } from '../../../../shared/exceptions/BusinessRuleError';
import { ForbiddenError } from '../../../../shared/exceptions/ForbiddenError';

/**
 * Caso de uso para reembolsar un pago
 * @description Marca un pago completado como reembolsado. Aplica control de
 * acceso por ownership: ADMIN sin restricción, STYLIST solo si es el
 * estilista asignado a la cita del pago; CLIENT no tiene acceso a esta
 * operación (fuera del alcance aprobado, ver F18)
 */
export class RefundPayment {
  constructor(
    private paymentRepository: IPaymentRepository,
    private appointmentRepository: IAppointmentRepository,
  ) {}

  /**
   * Ejecuta el caso de uso
   * @param dto - Datos para reembolsar el pago
   * @param requesterId - ID del usuario que realiza la operación
   * @param requesterRole - Nombre del rol del usuario solicitante
   * @returns El pago reembolsado
   * @throws NotFoundError si el pago no existe, o si la cita asociada no existe
   * @throws ForbiddenError si el usuario no tiene permisos sobre la cita del pago
   * @throws BusinessRuleError si el pago no puede ser reembolsado
   */
  async execute(
    dto: RefundPaymentDto,
    requesterId: string,
    requesterRole: string,
  ): Promise<PaymentResponseDto> {
    const payment = await this.paymentRepository.findById(dto.paymentId);

    if (!payment) {
      throw new NotFoundError('Payment', dto.paymentId);
    }

    await this.validateAccessPermissions(payment.appointmentId, requesterId, requesterRole);

    if (!payment.isCompleted) {
      throw new BusinessRuleError('Only completed payments can be refunded');
    }

    // Marcar como reembolsado con razón opcional
    payment.refund(dto.reason);

    // Guardar cambios
    const updatedPayment = await this.paymentRepository.update(payment);

    return this.toResponseDto(updatedPayment);
  }

  /**
   * Valida que el usuario tenga permisos para operar sobre el pago, a partir
   * de la cita asociada. CLIENT no tiene acceso a esta operación bajo ninguna
   * circunstancia (solo lectura, fuera del alcance aprobado)
   * @throws NotFoundError si la cita asociada no existe
   * @throws ForbiddenError si no tiene permisos
   */
  private async validateAccessPermissions(
    appointmentId: string,
    requesterId: string,
    requesterRole: string,
  ): Promise<void> {
    // ADMIN puede reembolsar cualquier pago
    if (requesterRole === 'ADMIN') return;

    if (requesterRole === 'STYLIST') {
      const appointment = await this.appointmentRepository.findById(appointmentId);
      if (!appointment) {
        throw new NotFoundError('Appointment', appointmentId);
      }

      if (appointment.stylistId !== requesterId) {
        throw new ForbiddenError('You can only access payments for your own appointments');
      }
      return;
    }

    // CLIENT y cualquier otro rol: sin acceso a esta operación
    throw new ForbiddenError('You can only access payments for your own appointments');
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
