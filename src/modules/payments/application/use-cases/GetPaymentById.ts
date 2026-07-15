import { Payment } from '../../domain/entities/Payment';
import { IPaymentRepository } from '../../domain/repositories/IPaymentRepository';
import { IAppointmentRepository } from '../../../appointments/domain/repositories/IAppointmentRepository';
import { PaymentResponseDto } from '../dto/response/PaymentResponseDto';
import { NotFoundError } from '../../../../shared/exceptions/NotFoundError';
import { ForbiddenError } from '../../../../shared/exceptions/ForbiddenError';

/**
 * Caso de uso para obtener un pago por ID
 * @description Busca y retorna un pago específico, aplicando control de acceso
 * por ownership sobre la cita asociada: ADMIN sin restricción, STYLIST solo
 * pagos de citas donde es el estilista asignado, CLIENT solo pagos de citas
 * donde es el cliente o el creador (F18)
 */
export class GetPaymentById {
  constructor(
    private paymentRepository: IPaymentRepository,
    private appointmentRepository: IAppointmentRepository,
  ) {}

  /**
   * Ejecuta el caso de uso
   * @param id - ID del pago a buscar
   * @param requesterId - ID del usuario que realiza la consulta
   * @param requesterRole - Nombre del rol del usuario solicitante
   * @returns El pago encontrado
   * @throws NotFoundError si el pago no existe, o si la cita asociada no
   * existe (solo se resuelve para STYLIST/CLIENT, ver validateAccessPermissions)
   * @throws ForbiddenError si el usuario no tiene permisos sobre la cita del pago
   */
  async execute(
    id: string,
    requesterId: string,
    requesterRole: string,
  ): Promise<PaymentResponseDto> {
    const payment = await this.paymentRepository.findById(id);

    if (!payment) {
      throw new NotFoundError('Payment', id);
    }

    await this.validateAccessPermissions(payment.appointmentId, requesterId, requesterRole);

    return this.toResponseDto(payment);
  }

  /**
   * Valida que el usuario tenga permisos sobre la cita asociada al pago
   * @param appointmentId - ID de la cita asociada al pago
   * @param requesterId - ID del usuario solicitante
   * @param requesterRole - Nombre del rol del usuario
   * @throws NotFoundError si la cita asociada no existe
   * @throws ForbiddenError si no tiene permisos
   */
  private async validateAccessPermissions(
    appointmentId: string,
    requesterId: string,
    requesterRole: string,
  ): Promise<void> {
    // ADMIN puede ver cualquier pago
    if (requesterRole === 'ADMIN') return;

    if (requesterRole === 'STYLIST' || requesterRole === 'CLIENT') {
      const appointment = await this.appointmentRepository.findById(appointmentId);
      if (!appointment) {
        throw new NotFoundError('Appointment', appointmentId);
      }

      if (requesterRole === 'STYLIST') {
        if (appointment.stylistId !== requesterId) {
          throw new ForbiddenError('You can only access payments for your own appointments');
        }
        return;
      }

      // CLIENT: dueño de la cita (cliente o creador)
      if (appointment.clientId !== requesterId && appointment.userId !== requesterId) {
        throw new ForbiddenError('You can only access payments for your own appointments');
      }
      return;
    }

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
