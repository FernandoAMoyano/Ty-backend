import { generateUuid } from '../../../../shared/utils/uuid';
import { Payment } from '../../domain/entities/Payment';
import { IPaymentRepository } from '../../domain/repositories/IPaymentRepository';
import { IAppointmentRepository } from '../../../appointments/domain/repositories/IAppointmentRepository';
import { IAppointmentStatusRepository } from '../../../appointments/domain/repositories/IAppointmentStatusRepository';
import { CreatePaymentDto } from '../dto/request/CreatePaymentDto';
import { PaymentResponseDto } from '../dto/response/PaymentResponseDto';
import { ValidationError } from '../../../../shared/exceptions/ValidationError';
import { NotFoundError } from '../../../../shared/exceptions/NotFoundError';
import { BusinessRuleError } from '../../../../shared/exceptions/BusinessRuleError';
import { ForbiddenError } from '../../../../shared/exceptions/ForbiddenError';

/**
 * Caso de uso para crear un pago
 * @description Crea un nuevo pago asociado a una cita. Aplica control de acceso
 * por ownership (PAY-25): ADMIN sin restricción, STYLIST solo puede crear pagos
 * para citas donde es el estilista asignado (misma regla que process/cancel, F18)
 */
export class CreatePayment {
  constructor(
    private paymentRepository: IPaymentRepository,
    private appointmentRepository: IAppointmentRepository,
    private appointmentStatusRepository: IAppointmentStatusRepository,
  ) {}

  /**
   * Ejecuta el caso de uso
   * @param dto - Datos para crear el pago
   * @param requesterId - ID del usuario que realiza la operación (opcional por compatibilidad;
   * si se omite junto con requesterRole, no se aplica validación de ownership)
   * @param requesterRole - Nombre del rol del usuario solicitante
   * @returns El pago creado
   * @throws ForbiddenError si un STYLIST intenta crear un pago para una cita ajena
   */
  async execute(
    dto: CreatePaymentDto,
    requesterId?: string,
    requesterRole?: string,
  ): Promise<PaymentResponseDto> {
    // Validar que el monto sea positivo
    if (dto.amount <= 0) {
      throw new ValidationError('Amount must be greater than 0');
    }

    // Validar que la cita exista
    const appointment = await this.appointmentRepository.findById(dto.appointmentId);
    if (!appointment) {
      throw new NotFoundError('Appointment', dto.appointmentId);
    }

    // Validar ownership: STYLIST solo puede crear pagos de sus propias citas (PAY-25)
    this.validateAccessPermissions(appointment, requesterId, requesterRole);

    // Validar que la cita esté en un estado válido para crear pago
    const status = await this.appointmentStatusRepository.findById(appointment.statusId);
    const allowedStatuses = ['CONFIRMED', 'COMPLETED'];
    if (!status || !allowedStatuses.includes(status.name)) {
      throw new BusinessRuleError(
        `Cannot create a payment for an appointment with status ${status?.name || 'UNKNOWN'}. Appointment must be confirmed or completed`,
      );
    }

    // Crear la entidad de pago
    const payment = Payment.create(
      generateUuid(),
      dto.amount,
      dto.appointmentId,
    );

    // Guardar en el repositorio
    const savedPayment = await this.paymentRepository.save(payment);

    // Retornar DTO de respuesta
    return this.toResponseDto(savedPayment);
  }

  /**
   * Valida que el usuario tenga permisos para crear un pago sobre la cita indicada.
   * Si no se proporciona requesterId/requesterRole (compatibilidad hacia atrás), no
   * se aplica ninguna restricción. ADMIN no tiene restricción; STYLIST solo puede
   * crear pagos para citas donde es el estilista asignado (PAY-25, alineado con F18)
   * @throws ForbiddenError si un STYLIST intenta crear un pago para una cita ajena
   */
  private validateAccessPermissions(
    appointment: { stylistId?: string },
    requesterId?: string,
    requesterRole?: string,
  ): void {
    if (!requesterId || !requesterRole) return;
    if (requesterRole === 'ADMIN') return;

    if (requesterRole === 'STYLIST') {
      if (appointment.stylistId !== requesterId) {
        throw new ForbiddenError('You can only create payments for your own appointments');
      }
    }
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
