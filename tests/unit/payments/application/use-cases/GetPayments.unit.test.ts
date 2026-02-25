import { GetPayments } from '../../../../../src/modules/payments/application/use-cases/GetPayments';
import { IPaymentRepository } from '../../../../../src/modules/payments/domain/repositories/IPaymentRepository';
import { Payment, PaymentStatusEnum, PaymentMethodEnum } from '../../../../../src/modules/payments/domain/entities/Payment';

describe('GetPayments Use Case', () => {
  let getPayments: GetPayments;
  let mockPaymentRepository: jest.Mocked<IPaymentRepository>;

  const mockPayments = [
    new Payment({
      id: '123e4567-e89b-12d3-a456-426614174001',
      amount: 100.00,
      status: PaymentStatusEnum.COMPLETED,
      method: PaymentMethodEnum.CREDIT_CARD,
      paymentDate: new Date('2025-01-15T12:00:00Z'),
      appointmentId: '123e4567-e89b-12d3-a456-426614174100',
      createdAt: new Date('2025-01-15T10:00:00Z'),
      updatedAt: new Date('2025-01-15T12:00:00Z'),
    }),
    new Payment({
      id: '123e4567-e89b-12d3-a456-426614174002',
      amount: 50.00,
      status: PaymentStatusEnum.PENDING,
      method: null,
      paymentDate: null,
      appointmentId: '123e4567-e89b-12d3-a456-426614174101',
      createdAt: new Date('2025-01-16T10:00:00Z'),
      updatedAt: new Date('2025-01-16T10:00:00Z'),
    }),
  ];

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

    getPayments = new GetPayments(mockPaymentRepository);
  });

  // Debería retornar lista paginada de pagos
  it('should return paginated list of payments', async () => {
    mockPaymentRepository.findAll.mockResolvedValue({
      data: mockPayments,
      total: 2,
      page: 1,
      limit: 20,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false,
    });

    const result = await getPayments.execute({});

    expect(result.payments).toHaveLength(2);
    expect(result.total).toBe(2);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
    expect(result.totalPages).toBe(1);
    expect(result.hasNextPage).toBe(false);
    expect(result.hasPreviousPage).toBe(false);
  });

  // Debería aplicar paginación personalizada
  it('should apply custom pagination', async () => {
    mockPaymentRepository.findAll.mockResolvedValue({
      data: [mockPayments[0]],
      total: 2,
      page: 1,
      limit: 1,
      totalPages: 2,
      hasNextPage: true,
      hasPreviousPage: false,
    });

    const result = await getPayments.execute({ page: 1, limit: 1 });

    expect(result.payments).toHaveLength(1);
    expect(result.limit).toBe(1);
    expect(result.totalPages).toBe(2);
    expect(result.hasNextPage).toBe(true);
    expect(mockPaymentRepository.findAll).toHaveBeenCalledWith(
      expect.any(Object),
      { page: 1, limit: 1 },
    );
  });

  // Debería filtrar por estado
  it('should filter by status', async () => {
    mockPaymentRepository.findAll.mockResolvedValue({
      data: [mockPayments[0]],
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false,
    });

    const result = await getPayments.execute({ status: PaymentStatusEnum.COMPLETED });

    expect(result.payments).toHaveLength(1);
    expect(result.payments[0].status).toBe(PaymentStatusEnum.COMPLETED);
    expect(mockPaymentRepository.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ status: PaymentStatusEnum.COMPLETED }),
      expect.any(Object),
    );
  });

  // Debería filtrar por appointmentId
  it('should filter by appointmentId', async () => {
    const appointmentId = '123e4567-e89b-12d3-a456-426614174100';
    mockPaymentRepository.findAll.mockResolvedValue({
      data: [mockPayments[0]],
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false,
    });

    const result = await getPayments.execute({ appointmentId });

    expect(result.payments).toHaveLength(1);
    expect(result.payments[0].appointmentId).toBe(appointmentId);
    expect(mockPaymentRepository.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ appointmentId }),
      expect.any(Object),
    );
  });

  // Debería filtrar por rango de fechas
  it('should filter by date range', async () => {
    const startDate = '2025-01-01';
    const endDate = '2025-01-31';

    mockPaymentRepository.findAll.mockResolvedValue({
      data: mockPayments,
      total: 2,
      page: 1,
      limit: 20,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false,
    });

    await getPayments.execute({ startDate, endDate });

    expect(mockPaymentRepository.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      }),
      expect.any(Object),
    );
  });

  // Debería retornar lista vacía cuando no hay pagos
  it('should return empty list when no payments exist', async () => {
    mockPaymentRepository.findAll.mockResolvedValue({
      data: [],
      total: 0,
      page: 1,
      limit: 20,
      totalPages: 0,
      hasNextPage: false,
      hasPreviousPage: false,
    });

    const result = await getPayments.execute({});

    expect(result.payments).toHaveLength(0);
    expect(result.total).toBe(0);
  });

  // Debería usar valores por defecto para page y limit
  it('should use default values for page and limit', async () => {
    mockPaymentRepository.findAll.mockResolvedValue({
      data: [],
      total: 0,
      page: 1,
      limit: 20,
      totalPages: 0,
      hasNextPage: false,
      hasPreviousPage: false,
    });

    await getPayments.execute({});

    expect(mockPaymentRepository.findAll).toHaveBeenCalledWith(
      expect.any(Object),
      { page: 1, limit: 20 },
    );
  });
});
