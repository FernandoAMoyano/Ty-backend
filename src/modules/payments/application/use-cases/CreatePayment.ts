import { v4 as uuidv4 } from 'uuid';
import { Payment } from '../../domain/entities/Payment';
import { IPaymentRepository } from '../../domain/repositories/IPaymentRepository';
import { CreatePaymentDto } from '../dto/request/CreatePaymentDto';
import { PaymentResponseDto } from '../dto/response/PaymentResponseDto';

/**
 * Caso de uso para crear un pago
 * @description Crea un nuevo pago asociado a una cita
 */
export class CreatePayment {
  constructor(private paymentRepository: IPaymentRepository) {}

  /**
   * Ejecuta el caso de uso
   * @param dto - Datos para crear el pago
   * @returns El pago creado
   */
  async execute(dto: CreatePaymentDto): Promise<PaymentResponseDto> {
    // Validar que el monto sea positivo
    if (dto.amount <= 0) {
      throw new Error('El monto debe ser mayor a 0');
    }

    // Crear la entidad de pago
    const payment = Payment.create(
      uuidv4(),
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
