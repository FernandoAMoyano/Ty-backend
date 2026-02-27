import { RefundPayment } from '../../../../../src/modules/payments/application/use-cases/RefundPayment';
import { IPaymentRepository } from '../../../../../src/modules/payments/domain/repositories/IPaymentRepository';
import { Payment, PaymentStatusEnum, PaymentMethodEnum } from '../../../../../src/modules/payments/domain/entities/Payment';
import { NotFoundError } from '../../../../../src/shared/exceptions/NotFoundError';
import { BusinessRuleError } from '../../../../../src/shared/exceptions/BusinessRuleError';

describe('RefundPayment Use Case', () => {
  let refundPayment: RefundPayment;
  let mockPaymentRepository: jest.Mocked<IPaymentRepository>;

  beforeEach(() => {
    mockPaymentRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByAppointmentId: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      getStatistics: jest.fn(),
      getTotalByAppointment: jest.fn(),
    };

    refundPayment = new RefundPayment(mockPaymentRepository);
  });

  // Debería reembolsar un pago completado exitosamente
  it('should refund a completed payment successfully', async () => {
    const completedPayment = new Payment({
      id: '123e4567-e89b-12d3-a456-426614174000',
      amount: 100.00,
      status: PaymentStatusEnum.COMPLETED,
      method: PaymentMethodEnum.CREDIT_CARD,
      paymentDate: new Date(),
      appointmentId: '123e4567-e89b-12d3-a456-426614174001',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    mockPaymentRepository.findById.mockResolvedValue(completedPayment);
    mockPaymentRepository.update.mockImplementation(async (payment) => payment);

    const result = await refundPayment.execute({
      paymentId: completedPayment.id,
      reason: 'Cliente canceló la cita',
    });

    expect(result.status).toBe(PaymentStatusEnum.REFUNDED);
    expect(mockPaymentRepository.update).toHaveBeenCalledTimes(1);
  });

  // Debería reembolsar sin razón (razón opcional)
  it('should refund without reason (reason is optional)', async () => {
    const completedPayment = new Payment({
      id: '123e4567-e89b-12d3-a456-426614174000',
      amount: 100.00,
      status: PaymentStatusEnum.COMPLETED,
      method: PaymentMethodEnum.CASH,
      paymentDate: new Date(),
      appointmentId: '123e4567-e89b-12d3-a456-426614174001',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    mockPaymentRepository.findById.mockResolvedValue(completedPayment);
    mockPaymentRepository.update.mockImplementation(async (payment) => payment);

    const result = await refundPayment.execute({
      paymentId: completedPayment.id,
    });

    expect(result.status).toBe(PaymentStatusEnum.REFUNDED);
  });

  // Debería lanzar NotFoundError si el pago no existe
  it('should throw NotFoundError if payment does not exist', async () => {
    mockPaymentRepository.findById.mockResolvedValue(null);

    await expect(
      refundPayment.execute({
        paymentId: 'non-existent-id',
      }),
    ).rejects.toThrow(NotFoundError);

    expect(mockPaymentRepository.update).not.toHaveBeenCalled();
  });

  // Debería lanzar BusinessRuleError si el pago está pendiente
  it('should throw BusinessRuleError if payment is pending', async () => {
    const pendingPayment = new Payment({
      id: '123e4567-e89b-12d3-a456-426614174000',
      amount: 100.00,
      status: PaymentStatusEnum.PENDING,
      method: null,
      paymentDate: null,
      appointmentId: '123e4567-e89b-12d3-a456-426614174001',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    mockPaymentRepository.findById.mockResolvedValue(pendingPayment);

    await expect(
      refundPayment.execute({
        paymentId: pendingPayment.id,
      }),
    ).rejects.toThrow(BusinessRuleError);

    expect(mockPaymentRepository.update).not.toHaveBeenCalled();
  });

  // Debería lanzar BusinessRuleError si el pago ya fue reembolsado
  it('should throw BusinessRuleError if payment is already refunded', async () => {
    const refundedPayment = new Payment({
      id: '123e4567-e89b-12d3-a456-426614174000',
      amount: 100.00,
      status: PaymentStatusEnum.REFUNDED,
      method: PaymentMethodEnum.CREDIT_CARD,
      paymentDate: new Date(),
      appointmentId: '123e4567-e89b-12d3-a456-426614174001',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    mockPaymentRepository.findById.mockResolvedValue(refundedPayment);

    await expect(
      refundPayment.execute({
        paymentId: refundedPayment.id,
      }),
    ).rejects.toThrow(BusinessRuleError);

    expect(mockPaymentRepository.update).not.toHaveBeenCalled();
  });

  // Debería lanzar BusinessRuleError si el pago falló
  it('should throw BusinessRuleError if payment failed', async () => {
    const failedPayment = new Payment({
      id: '123e4567-e89b-12d3-a456-426614174000',
      amount: 100.00,
      status: PaymentStatusEnum.FAILED,
      method: null,
      paymentDate: null,
      appointmentId: '123e4567-e89b-12d3-a456-426614174001',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    mockPaymentRepository.findById.mockResolvedValue(failedPayment);

    await expect(
      refundPayment.execute({
        paymentId: failedPayment.id,
      }),
    ).rejects.toThrow(BusinessRuleError);

    expect(mockPaymentRepository.update).not.toHaveBeenCalled();
  });

  // Debería mantener el método de pago original después del reembolso
  it('should keep original payment method after refund', async () => {
    const completedPayment = new Payment({
      id: '123e4567-e89b-12d3-a456-426614174000',
      amount: 150.00,
      status: PaymentStatusEnum.COMPLETED,
      method: PaymentMethodEnum.TRANSFER,
      paymentDate: new Date(),
      appointmentId: '123e4567-e89b-12d3-a456-426614174001',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    mockPaymentRepository.findById.mockResolvedValue(completedPayment);
    mockPaymentRepository.update.mockImplementation(async (payment) => payment);

    const result = await refundPayment.execute({
      paymentId: completedPayment.id,
    });

    expect(result.method).toBe(PaymentMethodEnum.TRANSFER);
    expect(result.amount).toBe(150.00);
  });
});
