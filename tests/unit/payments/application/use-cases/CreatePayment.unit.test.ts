import { CreatePayment } from '../../../../../src/modules/payments/application/use-cases/CreatePayment';
import { IPaymentRepository } from '../../../../../src/modules/payments/domain/repositories/IPaymentRepository';
import { IAppointmentRepository } from '../../../../../src/modules/appointments/domain/repositories/IAppointmentRepository';
import { IAppointmentStatusRepository } from '../../../../../src/modules/appointments/domain/repositories/IAppointmentStatusRepository';
import { Payment, PaymentStatusEnum } from '../../../../../src/modules/payments/domain/entities/Payment';
import { NotFoundError } from '../../../../../src/shared/exceptions/NotFoundError';
import { BusinessRuleError } from '../../../../../src/shared/exceptions/BusinessRuleError';

describe('CreatePayment Use Case', () => {
  let createPayment: CreatePayment;
  let mockPaymentRepository: jest.Mocked<IPaymentRepository>;
  let mockAppointmentRepository: jest.Mocked<IAppointmentRepository>;
  let mockAppointmentStatusRepository: jest.Mocked<IAppointmentStatusRepository>;

  const validAppointmentId = '123e4567-e89b-12d3-a456-426614174001';
  const validStatusId = '123e4567-e89b-12d3-a456-426614174002';

  const mockAppointment = {
    id: validAppointmentId,
    statusId: validStatusId,
    dateTime: new Date(),
    duration: 60,
    userId: '123e4567-e89b-12d3-a456-426614174003',
    clientId: '123e4567-e89b-12d3-a456-426614174004',
    scheduleId: '123e4567-e89b-12d3-a456-426614174005',
    serviceIds: [],
  };

  const mockConfirmedStatus = {
    id: validStatusId,
    name: 'CONFIRMED',
    description: 'Confirmed appointment',
  };

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

    mockAppointmentRepository = {
      findById: jest.fn(),
      findAll: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      existsById: jest.fn(),
      findByClientId: jest.fn(),
      findByStylistId: jest.fn(),
      findByUserId: jest.fn(),
      findByStatusId: jest.fn(),
      findByDateRange: jest.fn(),
      findByClientAndDateRange: jest.fn(),
      findByStylistAndDateRange: jest.fn(),
      findConflictingAppointments: jest.fn(),
      findByScheduleId: jest.fn(),
      findByDate: jest.fn(),
      countByStatus: jest.fn(),
      countByDateRange: jest.fn(),
      findUpcomingAppointments: jest.fn(),
      findPendingConfirmation: jest.fn(),
    } as unknown as jest.Mocked<IAppointmentRepository>;

    mockAppointmentStatusRepository = {
      findById: jest.fn(),
      findByName: jest.fn(),
      findAll: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      existsById: jest.fn(),
      existsByName: jest.fn(),
      findTerminalStatuses: jest.fn(),
      findActiveStatuses: jest.fn(),
    } as unknown as jest.Mocked<IAppointmentStatusRepository>;

    // Configurar mocks por defecto para caso exitoso
    mockAppointmentRepository.findById.mockResolvedValue(mockAppointment as any);
    mockAppointmentStatusRepository.findById.mockResolvedValue(mockConfirmedStatus as any);

    createPayment = new CreatePayment(
      mockPaymentRepository,
      mockAppointmentRepository,
      mockAppointmentStatusRepository,
    );
  });

  // Debería crear un pago exitosamente
  it('should create a payment successfully', async () => {
    const dto = {
      amount: 100.50,
      appointmentId: validAppointmentId,
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
      appointmentId: validAppointmentId,
    };

    await expect(createPayment.execute(dto)).rejects.toThrow('Amount must be greater than 0');
    expect(mockPaymentRepository.save).not.toHaveBeenCalled();
  });

  // Debería lanzar error si el monto es negativo
  it('should throw error if amount is negative', async () => {
    const dto = {
      amount: -50,
      appointmentId: validAppointmentId,
    };

    await expect(createPayment.execute(dto)).rejects.toThrow('Amount must be greater than 0');
    expect(mockPaymentRepository.save).not.toHaveBeenCalled();
  });

  // Debería generar un ID único para el pago
  it('should generate a unique ID for the payment', async () => {
    const dto = {
      amount: 75.00,
      appointmentId: validAppointmentId,
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
      appointmentId: validAppointmentId,
    };

    mockPaymentRepository.save.mockImplementation(async (payment: Payment) => payment);

    const result = await createPayment.execute(dto);

    expect(result.createdAt).toBeInstanceOf(Date);
    expect(result.updatedAt).toBeInstanceOf(Date);
  });

  // Debería lanzar NotFoundError cuando la cita no existe
  it('should throw NotFoundError when appointment does not exist', async () => {
    const dto = {
      amount: 100,
      appointmentId: validAppointmentId,
    };

    mockAppointmentRepository.findById.mockResolvedValue(null);

    await expect(createPayment.execute(dto)).rejects.toThrow(NotFoundError);
    expect(mockPaymentRepository.save).not.toHaveBeenCalled();
  });

  // Debería lanzar BusinessRuleError cuando la cita está en estado PENDING
  it('should throw BusinessRuleError when appointment is PENDING', async () => {
    const dto = {
      amount: 100,
      appointmentId: validAppointmentId,
    };

    mockAppointmentStatusRepository.findById.mockResolvedValue({ id: validStatusId, name: 'PENDING', description: '' } as any);

    await expect(createPayment.execute(dto)).rejects.toThrow(BusinessRuleError);
    expect(mockPaymentRepository.save).not.toHaveBeenCalled();
  });

  // Debería lanzar BusinessRuleError cuando la cita está en estado CANCELLED
  it('should throw BusinessRuleError when appointment is CANCELLED', async () => {
    const dto = {
      amount: 100,
      appointmentId: validAppointmentId,
    };

    mockAppointmentStatusRepository.findById.mockResolvedValue({ id: validStatusId, name: 'CANCELLED', description: '' } as any);

    await expect(createPayment.execute(dto)).rejects.toThrow(BusinessRuleError);
    expect(mockPaymentRepository.save).not.toHaveBeenCalled();
  });

  // Debería permitir crear pago para cita COMPLETED (pago posterior)
  it('should allow payment for COMPLETED appointment', async () => {
    const dto = {
      amount: 100,
      appointmentId: validAppointmentId,
    };

    mockAppointmentStatusRepository.findById.mockResolvedValue({ id: validStatusId, name: 'COMPLETED', description: '' } as any);
    mockPaymentRepository.save.mockImplementation(async (payment: Payment) => payment);

    const result = await createPayment.execute(dto);

    expect(result.amount).toBe(100);
    expect(mockPaymentRepository.save).toHaveBeenCalledTimes(1);
  });
});
