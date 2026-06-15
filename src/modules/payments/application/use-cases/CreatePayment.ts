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

/**
 * Caso de uso para crear un pago
 * @description Crea un nuevo pago asociado a una cita
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
   * @returns El pago creado
   */
  async execute(dto: CreatePaymentDto): Promise<PaymentResponseDto> {
    // Validar que el monto sea positivo
    if (dto.amount <= 0) {
      throw new ValidationError('Amount must be greater than 0');
    }

    // Validar que la cita exista
    const appointment = await this.appointmentRepository.findById(dto.appointmentId);
    if (!appointment) {
      throw new NotFoundError('Appointment', dto.appointmentId);
    }

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
