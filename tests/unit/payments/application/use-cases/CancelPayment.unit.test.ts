import { CancelPayment } from '../../../../../src/modules/payments/application/use-cases/CancelPayment';
import { IPaymentRepository } from '../../../../../src/modules/payments/domain/repositories/IPaymentRepository';
import { Payment, PaymentStatusEnum, PaymentMethodEnum } from '../../../../../src/modules/payments/domain/entities/Payment';
import { NotFoundError } from '../../../../../src/shared/exceptions/NotFoundError';
import { BusinessRuleError } from '../../../../../src/shared/exceptions/BusinessRuleError';

describe('CancelPayment Use Case', () => {
  let cancelPayment: CancelPayment;
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

    cancelPayment = new CancelPayment(mockPaymentRepository);
  });

  // Debería cancelar un pago pendiente exitosamente
  it('should cancel a pending payment successfully', async () => {
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

    const result = await cancelPayment.execute(pendingPayment.id);

    expect(result.status).toBe(PaymentStatusEnum.FAILED);
    expect(mockPaymentRepository.update).toHaveBeenCalledTimes(1);
  });

  // Debería lanzar NotFoundError si el pago no existe
  it('should throw NotFoundError if payment does not exist', async () => {
    mockPaymentRepository.findById.mockResolvedValue(null);

    await expect(cancelPayment.execute('non-existent-id')).rejects.toThrow(NotFoundError);

    expect(mockPaymentRepository.update).not.toHaveBeenCalled();
  });

  // Debería lanzar BusinessRuleError si el pago está completado
  it('should throw BusinessRuleError if payment is completed', async () => {
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

    await expect(cancelPayment.execute(completedPayment.id)).rejects.toThrow(BusinessRuleError);

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

    await expect(cancelPayment.execute(refundedPayment.id)).rejects.toThrow(BusinessRuleError);

    expect(mockPaymentRepository.update).not.toHaveBeenCalled();
  });

  // Debería lanzar BusinessRuleError si el pago ya está fallido
  it('should throw BusinessRuleError if payment is already failed', async () => {
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

    await expect(cancelPayment.execute(failedPayment.id)).rejects.toThrow(BusinessRuleError);

    expect(mockPaymentRepository.update).not.toHaveBeenCalled();
  });

  // Debería mantener el monto original después de cancelar
  it('should keep original amount after cancellation', async () => {
    const pendingPayment = new Payment({
      id: '123e4567-e89b-12d3-a456-426614174000',
      amount: 250.75,
      status: PaymentStatusEnum.PENDING,
      method: null,
      paymentDate: null,
      appointmentId: '123e4567-e89b-12d3-a456-426614174001',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    mockPaymentRepository.findById.mockResolvedValue(pendingPayment);
    mockPaymentRepository.update.mockImplementation(async (payment) => payment);

    const result = await cancelPayment.execute(pendingPayment.id);

    expect(result.amount).toBe(250.75);
    expect(result.appointmentId).toBe(pendingPayment.appointmentId);
  });

  // Debería mantener method y paymentDate como null después de cancelar
  it('should keep method and paymentDate as null after cancellation', async () => {
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

    const result = await cancelPayment.execute(pendingPayment.id);

    expect(result.method).toBeNull();
    expect(result.paymentDate).toBeNull();
  });
});
