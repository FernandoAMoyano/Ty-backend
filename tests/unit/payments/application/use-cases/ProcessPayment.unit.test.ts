import { ProcessPayment } from '../../../../../src/modules/payments/application/use-cases/ProcessPayment';
import { IPaymentRepository } from '../../../../../src/modules/payments/domain/repositories/IPaymentRepository';
import { Payment, PaymentStatusEnum, PaymentMethodEnum } from '../../../../../src/modules/payments/domain/entities/Payment';
import { NotFoundError } from '../../../../../src/shared/exceptions/NotFoundError';
import { BusinessRuleError } from '../../../../../src/shared/exceptions/BusinessRuleError';

describe('ProcessPayment Use Case', () => {
  let processPayment: ProcessPayment;
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

    processPayment = new ProcessPayment(mockPaymentRepository);
  });

  // Debería procesar un pago pendiente exitosamente
  it('should process a pending payment successfully', async () => {
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
    mockPaymentRepository.update.mockImplementation(async (payment) => payment);

    const result = await processPayment.execute({
      paymentId: pendingPayment.id,
      method: PaymentMethodEnum.CREDIT_CARD,
    });

    expect(result.status).toBe(PaymentStatusEnum.COMPLETED);
    expect(result.method).toBe(PaymentMethodEnum.CREDIT_CARD);
    expect(result.paymentDate).toBeInstanceOf(Date);
    expect(mockPaymentRepository.update).toHaveBeenCalledTimes(1);
  });

  // Debería lanzar NotFoundError si el pago no existe
  it('should throw NotFoundError if payment does not exist', async () => {
    mockPaymentRepository.findById.mockResolvedValue(null);

    await expect(
      processPayment.execute({
        paymentId: 'non-existent-id',
        method: PaymentMethodEnum.CASH,
      }),
    ).rejects.toThrow(NotFoundError);

    expect(mockPaymentRepository.update).not.toHaveBeenCalled();
  });

  // Debería lanzar BusinessRuleError si el pago no está pendiente
  it('should throw BusinessRuleError if payment is not pending', async () => {
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

    await expect(
      processPayment.execute({
        paymentId: completedPayment.id,
        method: PaymentMethodEnum.CREDIT_CARD,
      }),
    ).rejects.toThrow(BusinessRuleError);

    expect(mockPaymentRepository.update).not.toHaveBeenCalled();
  });

  // Debería funcionar con todos los métodos de pago
  it('should work with all payment methods', async () => {
    const methods = [
      PaymentMethodEnum.CASH,
      PaymentMethodEnum.CREDIT_CARD,
      PaymentMethodEnum.DEBIT_CARD,
      PaymentMethodEnum.TRANSFER,
      PaymentMethodEnum.ONLINE,
    ];

    for (const method of methods) {
      const pendingPayment = new Payment({
        id: `payment-${method}`,
        amount: 100.00,
        status: PaymentStatusEnum.PENDING,
        method: null,
        paymentDate: null,
        appointmentId: '123e4567-e89b-12d3-a456-426614174001',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockPaymentRepository.findById.mockResolvedValue(pendingPayment);
      mockPaymentRepository.update.mockImplementation(async (payment) => payment);

      const result = await processPayment.execute({
        paymentId: pendingPayment.id,
        method,
      });

      expect(result.method).toBe(method);
      expect(result.status).toBe(PaymentStatusEnum.COMPLETED);
    }
  });

  // No debería procesar un pago ya reembolsado
  it('should not process an already refunded payment', async () => {
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
      processPayment.execute({
        paymentId: refundedPayment.id,
        method: PaymentMethodEnum.CASH,
      }),
    ).rejects.toThrow(BusinessRuleError);
  });

  // No debería procesar un pago fallido
  it('should not process a failed payment', async () => {
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
      processPayment.execute({
        paymentId: failedPayment.id,
        method: PaymentMethodEnum.CASH,
      }),
    ).rejects.toThrow(BusinessRuleError);
  });
});
