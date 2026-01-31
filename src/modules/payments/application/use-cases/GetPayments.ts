import { Payment, PaymentStatusEnum } from '../../domain/entities/Payment';
import { IPaymentRepository } from '../../domain/repositories/IPaymentRepository';
import { PaymentFiltersDto } from '../dto/request/PaymentFiltersDto';
import { PaginatedPaymentsResponseDto } from '../dto/response/PaginatedPaymentsResponseDto';
import { PaymentResponseDto } from '../dto/response/PaymentResponseDto';

/**
 * Caso de uso para listar pagos con filtros
 * @description Obtiene una lista paginada de pagos con filtros opcionales
 */
export class GetPayments {
  constructor(private paymentRepository: IPaymentRepository) {}

  /**
   * Ejecuta el caso de uso
   * @param filters - Filtros y opciones de paginación
   * @returns Lista paginada de pagos
   */
  async execute(filters: PaymentFiltersDto): Promise<PaginatedPaymentsResponseDto> {
    const { page = 1, limit = 20, status, appointmentId, startDate, endDate } = filters;

    const result = await this.paymentRepository.findAll(
      {
        status: status as PaymentStatusEnum,
        appointmentId,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
      },
      { page, limit },
    );

    return {
      payments: result.data.map(payment => this.toResponseDto(payment)),
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
      hasNextPage: result.hasNextPage,
      hasPreviousPage: result.hasPreviousPage,
    };
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
