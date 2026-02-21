import { CreatePayment } from '../../../../../src/modules/payments/application/use-cases/CreatePayment';
import { IPaymentRepository } from '../../../../../src/modules/payments/domain/repositories/IPaymentRepository';
import { Payment, PaymentStatusEnum } from '../../../../../src/modules/payments/domain/entities/Payment';

describe('CreatePayment Use Case', () => {
  let createPayment: CreatePayment;
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

    createPayment = new CreatePayment(mockPaymentRepository);
  });

  // Debería crear un pago exitosamente
  it('should create a payment successfully', async () => {
    const dto = {
      amount: 100.50,
      appointmentId: '123e4567-e89b-12d3-a456-426614174001',
    };

    mockPaymentRepository.save.mockImplementation(async (payment: Payment) => payment);

    const result = await createPayment.execute(dto);

    expect(result.amount).toBe(100.50);
    expect(result.status).toBe(PaymentStatusEnum.PENDING);
    expect(result.method).toBeNull();
    expect(result.paymentDate).toBeNull();
    expect(result.appointmentId).toBe(dto.appointmentId);
    expect(mockPaymentRepository.save).toHaveBeenCalledTimes(1);
  });

  // Debería lanzar error si el monto es 0
  it('should throw error if amount is 0', async () => {
    const dto = {
      amount: 0,
      appointmentId: '123e4567-e89b-12d3-a456-426614174001',
    };

    await expect(createPayment.execute(dto)).rejects.toThrow('El monto debe ser mayor a 0');
    expect(mockPaymentRepository.save).not.toHaveBeenCalled();
  });

  // Debería lanzar error si el monto es negativo
  it('should throw error if amount is negative', async () => {
    const dto = {
      amount: -50,
      appointmentId: '123e4567-e89b-12d3-a456-426614174001',
    };

    await expect(createPayment.execute(dto)).rejects.toThrow('El monto debe ser mayor a 0');
    expect(mockPaymentRepository.save).not.toHaveBeenCalled();
  });

  // Debería generar un ID único para el pago
  it('should generate a unique ID for the payment', async () => {
    const dto = {
      amount: 75.00,
      appointmentId: '123e4567-e89b-12d3-a456-426614174001',
    };

    mockPaymentRepository.save.mockImplementation(async (payment: Payment) => payment);

    const result = await createPayment.execute(dto);

    expect(result.id).toBeDefined();
    expect(result.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  });

  // Debería establecer createdAt y updatedAt
  it('should set createdAt and updatedAt', async () => {
    const dto = {
      amount: 50.00,
      appointmentId: '123e4567-e89b-12d3-a456-426614174001',
    };

    mockPaymentRepository.save.mockImplementation(async (payment: Payment) => payment);

    const result = await createPayment.execute(dto);

    expect(result.createdAt).toBeInstanceOf(Date);
    expect(result.updatedAt).toBeInstanceOf(Date);
  });
});
