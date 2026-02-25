import { GetPaymentById } from '../../../../../src/modules/payments/application/use-cases/GetPaymentById';
import { IPaymentRepository } from '../../../../../src/modules/payments/domain/repositories/IPaymentRepository';
import { Payment, PaymentStatusEnum, PaymentMethodEnum } from '../../../../../src/modules/payments/domain/entities/Payment';
import { NotFoundError } from '../../../../../src/shared/exceptions/NotFoundError';

describe('GetPaymentById Use Case', () => {
  let getPaymentById: GetPaymentById;
  let mockPaymentRepository: jest.Mocked<IPaymentRepository>;

  const mockPayment = new Payment({
    id: '123e4567-e89b-12d3-a456-426614174000',
    amount: 100.50,
    status: PaymentStatusEnum.COMPLETED,
    method: PaymentMethodEnum.CREDIT_CARD,
    paymentDate: new Date('2025-01-15T12:00:00Z'),
    appointmentId: '123e4567-e89b-12d3-a456-426614174001',
    createdAt: new Date('2025-01-15T10:00:00Z'),
    updatedAt: new Date('2025-01-15T12:00:00Z'),
  });

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

    getPaymentById = new GetPaymentById(mockPaymentRepository);
  });

  // Debería retornar un pago existente
  it('should return an existing payment', async () => {
    mockPaymentRepository.findById.mockResolvedValue(mockPayment);

    const result = await getPaymentById.execute(mockPayment.id);

    expect(result.id).toBe(mockPayment.id);
    expect(result.amount).toBe(100.50);
    expect(result.status).toBe(PaymentStatusEnum.COMPLETED);
    expect(result.method).toBe(PaymentMethodEnum.CREDIT_CARD);
    expect(result.appointmentId).toBe(mockPayment.appointmentId);
    expect(mockPaymentRepository.findById).toHaveBeenCalledWith(mockPayment.id);
  });

  // Debería lanzar NotFoundError si el pago no existe
  it('should throw NotFoundError if payment does not exist', async () => {
    const nonExistentId = '999e4567-e89b-12d3-a456-426614174999';
    mockPaymentRepository.findById.mockResolvedValue(null);

    await expect(getPaymentById.execute(nonExistentId)).rejects.toThrow(NotFoundError);
    expect(mockPaymentRepository.findById).toHaveBeenCalledWith(nonExistentId);
  });

  // Debería retornar todos los campos del pago
  it('should return all payment fields', async () => {
    mockPaymentRepository.findById.mockResolvedValue(mockPayment);

    const result = await getPaymentById.execute(mockPayment.id);

    expect(result).toEqual({
      id: mockPayment.id,
      amount: mockPayment.amount,
      status: mockPayment.status,
      method: mockPayment.method,
      paymentDate: mockPayment.paymentDate,
      appointmentId: mockPayment.appointmentId,
      createdAt: mockPayment.createdAt,
      updatedAt: mockPayment.updatedAt,
    });
  });

  // Debería manejar pagos pendientes (sin método ni fecha)
  it('should handle pending payments (without method or date)', async () => {
    const pendingPayment = new Payment({
      id: '123e4567-e89b-12d3-a456-426614174002',
      amount: 75.00,
      status: PaymentStatusEnum.PENDING,
      method: null,
      paymentDate: null,
      appointmentId: '123e4567-e89b-12d3-a456-426614174001',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    mockPaymentRepository.findById.mockResolvedValue(pendingPayment);

    const result = await getPaymentById.execute(pendingPayment.id);

    expect(result.status).toBe(PaymentStatusEnum.PENDING);
    expect(result.method).toBeNull();
    expect(result.paymentDate).toBeNull();
  });
});
