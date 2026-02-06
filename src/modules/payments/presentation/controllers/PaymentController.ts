import { Response } from 'express';
import { CreatePayment } from '../../application/use-cases/CreatePayment';
import { GetPaymentById } from '../../application/use-cases/GetPaymentById';
import { GetPaymentsByAppointment } from '../../application/use-cases/GetPaymentsByAppointment';
import { GetPayments } from '../../application/use-cases/GetPayments';
import { ProcessPayment } from '../../application/use-cases/ProcessPayment';
import { RefundPayment } from '../../application/use-cases/RefundPayment';
import { CancelPayment } from '../../application/use-cases/CancelPayment';
import { GetPaymentStatistics } from '../../application/use-cases/GetPaymentStatistics';
import { UpdatePayment } from '../../application/use-cases/UpdatePayment';
import { PaymentMethodEnum } from '../../domain/entities/Payment';
import { AuthenticatedRequest } from '../../../auth/presentation/middleware/AuthMiddleware';

/**
 * Controlador para el módulo de pagos
 * @description Maneja las peticiones HTTP relacionadas con pagos
 */
export class PaymentController {
  constructor(
    private createPaymentUseCase: CreatePayment,
    private getPaymentByIdUseCase: GetPaymentById,
    private getPaymentsByAppointmentUseCase: GetPaymentsByAppointment,
    private getPaymentsUseCase: GetPayments,
    private processPaymentUseCase: ProcessPayment,
    private refundPaymentUseCase: RefundPayment,
    private cancelPaymentUseCase: CancelPayment,
    private getPaymentStatisticsUseCase: GetPaymentStatistics,
    private updatePaymentUseCase: UpdatePayment,
  ) {
    // Bind de métodos para mantener el contexto
    this.create = this.create.bind(this);
    this.getById = this.getById.bind(this);
    this.getByAppointment = this.getByAppointment.bind(this);
    this.getAll = this.getAll.bind(this);
    this.process = this.process.bind(this);
    this.refund = this.refund.bind(this);
    this.cancel = this.cancel.bind(this);
    this.getStatistics = this.getStatistics.bind(this);
    this.update = this.update.bind(this);
  }

  /**
   * Crea un nuevo pago
   * @description POST /payments
   * @access Admin, Stylist
   */
  async create(req: AuthenticatedRequest, res: Response): Promise<Response | void> {
    const { amount, appointmentId } = req.body;

    const payment = await this.createPaymentUseCase.execute({
      amount,
      appointmentId,
    });

    return res.status(201).json({
      success: true,
      data: payment,
      message: 'Pago creado exitosamente',
    });
  }

  /**
   * Obtiene un pago por ID
   * @description GET /payments/:id
   * @access Admin, Stylist, Owner
   */
  async getById(req: AuthenticatedRequest, res: Response): Promise<Response | void> {
    const { id } = req.params;

    const payment = await this.getPaymentByIdUseCase.execute(id);

    return res.status(200).json({
      success: true,
      data: payment,
      message: 'Pago obtenido exitosamente',
    });
  }

  /**
   * Obtiene los pagos de una cita
   * @description GET /payments/appointment/:appointmentId
   * @access Admin, Stylist, Owner
   */
  async getByAppointment(req: AuthenticatedRequest, res: Response): Promise<Response | void> {
    const { appointmentId } = req.params;

    const payments = await this.getPaymentsByAppointmentUseCase.execute(appointmentId);

    return res.status(200).json({
      success: true,
      data: payments,
      message: 'Pagos de la cita obtenidos exitosamente',
    });
  }

  /**
   * Obtiene todos los pagos con filtros
   * @description GET /payments
   * @access Admin
   */
  async getAll(req: AuthenticatedRequest, res: Response): Promise<Response | void> {
    const { page, limit, status, appointmentId, startDate, endDate } = req.query;

    const result = await this.getPaymentsUseCase.execute({
      page: page ? parseInt(page as string, 10) : undefined,
      limit: limit ? parseInt(limit as string, 10) : undefined,
      status: status as string | undefined,
      appointmentId: appointmentId as string | undefined,
      startDate: startDate as string | undefined,
      endDate: endDate as string | undefined,
    });

    return res.status(200).json({
      success: true,
      data: result,
      message: 'Pagos obtenidos exitosamente',
    });
  }

  /**
   * Procesa (completa) un pago
   * @description POST /payments/:id/process
   * @access Admin, Stylist
   */
  async process(req: AuthenticatedRequest, res: Response): Promise<Response | void> {
    const { id } = req.params;
    const { method } = req.body;

    const payment = await this.processPaymentUseCase.execute({
      paymentId: id,
      method: method as PaymentMethodEnum,
    });

    return res.status(200).json({
      success: true,
      data: payment,
      message: 'Pago procesado exitosamente',
    });
  }

  /**
   * Reembolsa un pago
   * @description POST /payments/:id/refund
   * @access Admin
   */
  async refund(req: AuthenticatedRequest, res: Response): Promise<Response | void> {
    const { id } = req.params;
    const { reason } = req.body;

    const payment = await this.refundPaymentUseCase.execute({
      paymentId: id,
      reason,
    });

    return res.status(200).json({
      success: true,
      data: payment,
      message: 'Pago reembolsado exitosamente',
    });
  }

  /**
   * Cancela un pago
   * @description POST /payments/:id/cancel
   * @access Admin, Stylist
   */
  async cancel(req: AuthenticatedRequest, res: Response): Promise<Response | void> {
    const { id } = req.params;

    const payment = await this.cancelPaymentUseCase.execute(id);

    return res.status(200).json({
      success: true,
      data: payment,
      message: 'Pago cancelado exitosamente',
    });
  }

  /**
   * Obtiene estadísticas de pagos
   * @description GET /payments/statistics
   * @access Admin
   */
  async getStatistics(req: AuthenticatedRequest, res: Response): Promise<Response | void> {
    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate as string) : new Date(new Date().setMonth(new Date().getMonth() - 1));
    const end = endDate ? new Date(endDate as string) : new Date();

    const statistics = await this.getPaymentStatisticsUseCase.execute(start, end);

    return res.status(200).json({
      success: true,
      data: statistics,
      message: 'Estadísticas obtenidas exitosamente',
    });
  }

  /**
   * Actualiza un pago
   * @description PUT /payments/:id
   * @access Admin
   */
  async update(req: AuthenticatedRequest, res: Response): Promise<Response | void> {
    const { id } = req.params;
    const { amount } = req.body;

    const payment = await this.updatePaymentUseCase.execute(id, { amount });

    return res.status(200).json({
      success: true,
      data: payment,
      message: 'Pago actualizado exitosamente',
    });
  }
}
