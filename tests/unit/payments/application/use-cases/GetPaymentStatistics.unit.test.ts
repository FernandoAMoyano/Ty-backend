import { GetPaymentStatistics } from '../../../../../src/modules/payments/application/use-cases/GetPaymentStatistics';
import { IPaymentRepository } from '../../../../../src/modules/payments/domain/repositories/IPaymentRepository';

describe('GetPaymentStatistics Use Case', () => {
  let getPaymentStatistics: GetPaymentStatistics;
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

    getPaymentStatistics = new GetPaymentStatistics(mockPaymentRepository);
  });

  // Debería retornar estadísticas de pagos para un período
  it('should return payment statistics for a period', async () => {
    const startDate = new Date('2025-01-01');
    const endDate = new Date('2025-01-31');

    const mockStats = {
      totalRevenue: 1500.00,
      totalPayments: 20,
      completedPayments: 15,
      pendingPayments: 3,
      refundedPayments: 1,
      failedPayments: 1,
      averagePayment: 100.00,
      paymentsByMethod: {
        CASH: 5,
        CREDIT_CARD: 8,
        DEBIT_CARD: 2,
      },
    };

    mockPaymentRepository.getStatistics.mockResolvedValue(mockStats);

    const result = await getPaymentStatistics.execute(startDate, endDate);

    expect(result.totalRevenue).toBe(1500.00);
    expect(result.totalPayments).toBe(20);
    expect(result.completedPayments).toBe(15);
    expect(result.pendingPayments).toBe(3);
    expect(result.refundedPayments).toBe(1);
    expect(result.failedPayments).toBe(1);
    expect(result.averagePayment).toBe(100.00);
    expect(result.paymentsByMethod).toEqual({
      CASH: 5,
      CREDIT_CARD: 8,
      DEBIT_CARD: 2,
    });
    expect(mockPaymentRepository.getStatistics).toHaveBeenCalledWith(startDate, endDate);
  });

  // Debería retornar estadísticas vacías cuando no hay pagos
  it('should return empty statistics when no payments exist', async () => {
    const startDate = new Date('2025-01-01');
    const endDate = new Date('2025-01-31');

    const emptyStats = {
      totalRevenue: 0,
      totalPayments: 0,
      completedPayments: 0,
      pendingPayments: 0,
      refundedPayments: 0,
      failedPayments: 0,
      averagePayment: 0,
      paymentsByMethod: {},
    };

    mockPaymentRepository.getStatistics.mockResolvedValue(emptyStats);

    const result = await getPaymentStatistics.execute(startDate, endDate);

    expect(result.totalRevenue).toBe(0);
    expect(result.totalPayments).toBe(0);
    expect(result.averagePayment).toBe(0);
    expect(result.paymentsByMethod).toEqual({});
  });

  // Debería pasar las fechas correctas al repositorio
  it('should pass correct dates to repository', async () => {
    const startDate = new Date('2025-06-01T00:00:00Z');
    const endDate = new Date('2025-06-30T23:59:59Z');

    mockPaymentRepository.getStatistics.mockResolvedValue({
      totalRevenue: 0,
      totalPayments: 0,
      completedPayments: 0,
      pendingPayments: 0,
      refundedPayments: 0,
      failedPayments: 0,
      averagePayment: 0,
      paymentsByMethod: {},
    });

    await getPaymentStatistics.execute(startDate, endDate);

    expect(mockPaymentRepository.getStatistics).toHaveBeenCalledWith(startDate, endDate);
  });

  // Debería manejar todos los métodos de pago en las estadísticas
  it('should handle all payment methods in statistics', async () => {
    const startDate = new Date('2025-01-01');
    const endDate = new Date('2025-12-31');

    const mockStats = {
      totalRevenue: 5000.00,
      totalPayments: 50,
      completedPayments: 45,
      pendingPayments: 2,
      refundedPayments: 2,
      failedPayments: 1,
      averagePayment: 111.11,
      paymentsByMethod: {
        CASH: 10,
        CREDIT_CARD: 20,
        DEBIT_CARD: 8,
        TRANSFER: 5,
        ONLINE: 2,
      },
    };

    mockPaymentRepository.getStatistics.mockResolvedValue(mockStats);

    const result = await getPaymentStatistics.execute(startDate, endDate);

    expect(result.paymentsByMethod.CASH).toBe(10);
    expect(result.paymentsByMethod.CREDIT_CARD).toBe(20);
    expect(result.paymentsByMethod.DEBIT_CARD).toBe(8);
    expect(result.paymentsByMethod.TRANSFER).toBe(5);
    expect(result.paymentsByMethod.ONLINE).toBe(2);
  });

  // Debería calcular correctamente la suma de pagos por estado
  it('should correctly calculate sum of payments by status', async () => {
    const startDate = new Date('2025-01-01');
    const endDate = new Date('2025-01-31');

    const mockStats = {
      totalRevenue: 1000.00,
      totalPayments: 10,
      completedPayments: 6,
      pendingPayments: 2,
      refundedPayments: 1,
      failedPayments: 1,
      averagePayment: 166.67,
      paymentsByMethod: {},
    };

    mockPaymentRepository.getStatistics.mockResolvedValue(mockStats);

    const result = await getPaymentStatistics.execute(startDate, endDate);

    // Verificar que la suma de estados = total
    const sumOfStates =
      result.completedPayments +
      result.pendingPayments +
      result.refundedPayments +
      result.failedPayments;

    expect(sumOfStates).toBe(result.totalPayments);
  });
});
