import { PrismaClient, PaymentStatus, PaymentMethod } from '@prisma/client';
import { Payment, PaymentStatusEnum, PaymentMethodEnum } from '../../domain/entities/Payment';
import {
  IPaymentRepository,
  PaymentFilters,
  PaginationOptions,
  PaginatedResult,
} from '../../domain/repositories/IPaymentRepository';

/**
 * Implementación del repositorio de pagos con Prisma
 */
export class PrismaPaymentRepository implements IPaymentRepository {
  constructor(private prisma: PrismaClient) {}

  /**
   * Guarda un nuevo pago
   */
  async save(payment: Payment): Promise<Payment> {
    const data = await this.prisma.payment.create({
      data: {
        id: payment.id,
        amount: payment.amount,
        status: payment.status as PaymentStatus,
        method: payment.method as PaymentMethod | null,
        paymentDate: payment.paymentDate,
        appointmentId: payment.appointmentId,
      },
    });

    return this.toDomain(data);
  }

  /**
   * Busca un pago por ID
   */
  async findById(id: string): Promise<Payment | null> {
    const data = await this.prisma.payment.findUnique({
      where: { id },
    });

    return data ? this.toDomain(data) : null;
  }

  /**
   * Busca pagos por ID de cita
   */
  async findByAppointmentId(appointmentId: string): Promise<Payment[]> {
    const data = await this.prisma.payment.findMany({
      where: { appointmentId },
      orderBy: { createdAt: 'desc' },
    });

    return data.map(item => this.toDomain(item));
  }

  /**
   * Busca todos los pagos con filtros
   */
  async findAll(
    filters?: PaymentFilters,
    pagination?: PaginationOptions,
  ): Promise<PaginatedResult<Payment>> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters?.status) {
      where.status = filters.status as PaymentStatus;
    }

    if (filters?.appointmentId) {
      where.appointmentId = filters.appointmentId;
    }

    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {};
      if (filters?.startDate) {
        where.createdAt.gte = filters.startDate;
      }
      if (filters?.endDate) {
        where.createdAt.lte = filters.endDate;
      }
    }

    const [data, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.payment.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: data.map(item => this.toDomain(item)),
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };
  }

  /**
   * Actualiza un pago
   */
  async update(payment: Payment): Promise<Payment> {
    const data = await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        amount: payment.amount,
        status: payment.status as PaymentStatus,
        method: payment.method as PaymentMethod | null,
        paymentDate: payment.paymentDate,
      },
    });

    return this.toDomain(data);
  }

  /**
   * Elimina un pago
   */
  async delete(id: string): Promise<boolean> {
    await this.prisma.payment.delete({
      where: { id },
    });
    return true;
  }

  /**
   * Obtiene estadísticas de pagos
   */
  async getStatistics(startDate: Date, endDate: Date): Promise<{
    totalRevenue: number;
    totalPayments: number;
    completedPayments: number;
    pendingPayments: number;
    refundedPayments: number;
    failedPayments: number;
    averagePayment: number;
    paymentsByMethod: Record<string, number>;
  }> {
    const where = {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    };

    // Obtener conteos por estado
    const [
      totalPayments,
      completedPayments,
      pendingPayments,
      refundedPayments,
      failedPayments,
    ] = await Promise.all([
      this.prisma.payment.count({ where }),
      this.prisma.payment.count({ where: { ...where, status: 'COMPLETED' } }),
      this.prisma.payment.count({ where: { ...where, status: 'PENDING' } }),
      this.prisma.payment.count({ where: { ...where, status: 'REFUNDED' } }),
      this.prisma.payment.count({ where: { ...where, status: 'FAILED' } }),
    ]);

    // Calcular ingresos totales (solo pagos completados)
    const revenueResult = await this.prisma.payment.aggregate({
      where: { ...where, status: 'COMPLETED' },
      _sum: { amount: true },
    });
    const totalRevenue = Number(revenueResult._sum.amount) || 0;

    // Calcular promedio
    const averagePayment = completedPayments > 0 ? totalRevenue / completedPayments : 0;

    // Pagos por método
    const paymentsByMethodResult = await this.prisma.payment.groupBy({
      by: ['method'],
      where: { ...where, status: 'COMPLETED', method: { not: null } },
      _count: true,
    });

    const paymentsByMethod: Record<string, number> = {};
    paymentsByMethodResult.forEach(item => {
      if (item.method) {
        paymentsByMethod[item.method] = item._count;
      }
    });

    return {
      totalRevenue,
      totalPayments,
      completedPayments,
      pendingPayments,
      refundedPayments,
      failedPayments,
      averagePayment,
      paymentsByMethod,
    };
  }

  /**
   * Obtiene el total de pagos completados por cita
   */
  async getTotalByAppointment(appointmentId: string): Promise<number> {
    const result = await this.prisma.payment.aggregate({
      where: {
        appointmentId,
        status: 'COMPLETED',
      },
      _sum: { amount: true },
    });

    return Number(result._sum.amount) || 0;
  }

  /**
   * Convierte datos de Prisma a entidad de dominio
   */
  private toDomain(data: any): Payment {
    return new Payment({
      id: data.id,
      amount: Number(data.amount),
      status: data.status as PaymentStatusEnum,
      method: data.method as PaymentMethodEnum | null,
      paymentDate: data.paymentDate,
      appointmentId: data.appointmentId,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    });
  }
}
