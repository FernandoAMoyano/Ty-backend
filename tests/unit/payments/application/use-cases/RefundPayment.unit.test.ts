import { RefundPayment } from '../../../../../src/modules/payments/application/use-cases/RefundPayment';
import { IPaymentRepository } from '../../../../../src/modules/payments/domain/repositories/IPaymentRepository';
import { IAppointmentRepository } from '../../../../../src/modules/appointments/domain/repositories/IAppointmentRepository';
import { Payment, PaymentStatusEnum, PaymentMethodEnum } from '../../../../../src/modules/payments/domain/entities/Payment';
import { NotFoundError } from '../../../../../src/shared/exceptions/NotFoundError';
import { BusinessRuleError } from '../../../../../src/shared/exceptions/BusinessRuleError';
import { ForbiddenError } from '../../../../../src/shared/exceptions/ForbiddenError';

describe('RefundPayment Use Case', () => {
  let refundPayment: RefundPayment;
  let mockPaymentRepository: jest.Mocked<IPaymentRepository>;
  let mockAppointmentRepository: jest.Mocked<IAppointmentRepository>;

  // Constantes de permisos -- tests existentes usan ADMIN para bypass de ownership
  const adminRequesterId = 'admin-requester-id';
  const adminRole = 'ADMIN';

  const validStylistId = '123e4567-e89b-12d3-a456-426614174010';
  const validAppointmentId = '123e4567-e89b-12d3-a456-426614174001';

  const mockAppointment = {
    id: validAppointmentId,
    stylistId: validStylistId,
    clientId: '123e4567-e89b-12d3-a456-426614174011',
    userId: '123e4567-e89b-12d3-a456-426614174012',
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
    } as unknown as jest.Mocked<IAppointmentRepository>;

    refundPayment = new RefundPayment(mockPaymentRepository, mockAppointmentRepository);
  });

  // Debería reembolsar un pago completado exitosamente
  it('should refund a completed payment successfully', async () => {
    const completedPayment = new Payment({
      id: '123e4567-e89b-12d3-a456-426614174000',
      amount: 100.00,
      status: PaymentStatusEnum.COMPLETED,
      method: PaymentMethodEnum.CREDIT_CARD,
      paymentDate: new Date(),
      appointmentId: validAppointmentId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    mockPaymentRepository.findById.mockResolvedValue(completedPayment);
    mockPaymentRepository.update.mockImplementation(async (payment) => payment);

    const result = await refundPayment.execute(
      {
        paymentId: completedPayment.id,
        reason: 'Cliente canceló la cita',
      },
      adminRequesterId,
      adminRole,
    );

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
      appointmentId: validAppointmentId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    mockPaymentRepository.findById.mockResolvedValue(completedPayment);
    mockPaymentRepository.update.mockImplementation(async (payment) => payment);

    const result = await refundPayment.execute(
      {
        paymentId: completedPayment.id,
      },
      adminRequesterId,
      adminRole,
    );

    expect(result.status).toBe(PaymentStatusEnum.REFUNDED);
  });

  // Debería lanzar NotFoundError si el pago no existe
  it('should throw NotFoundError if payment does not exist', async () => {
    mockPaymentRepository.findById.mockResolvedValue(null);

    await expect(
      refundPayment.execute(
        {
          paymentId: 'non-existent-id',
        },
        adminRequesterId,
        adminRole,
      ),
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
      appointmentId: validAppointmentId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    mockPaymentRepository.findById.mockResolvedValue(pendingPayment);

    await expect(
      refundPayment.execute(
        {
          paymentId: pendingPayment.id,
        },
        adminRequesterId,
        adminRole,
      ),
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
      appointmentId: validAppointmentId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    mockPaymentRepository.findById.mockResolvedValue(refundedPayment);

    await expect(
      refundPayment.execute(
        {
          paymentId: refundedPayment.id,
        },
        adminRequesterId,
        adminRole,
      ),
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
      appointmentId: validAppointmentId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    mockPaymentRepository.findById.mockResolvedValue(failedPayment);

    await expect(
      refundPayment.execute(
        {
          paymentId: failedPayment.id,
        },
        adminRequesterId,
        adminRole,
      ),
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
      appointmentId: validAppointmentId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    mockPaymentRepository.findById.mockResolvedValue(completedPayment);
    mockPaymentRepository.update.mockImplementation(async (payment) => payment);

    const result = await refundPayment.execute(
      {
        paymentId: completedPayment.id,
      },
      adminRequesterId,
      adminRole,
    );

    expect(result.method).toBe(PaymentMethodEnum.TRANSFER);
    expect(result.amount).toBe(150.00);
  });

  describe('Ownership (F18)', () => {
    // Payment.refund() muta la entidad en el lugar, así que cada test necesita
    // su propia instancia -- reusar una sola entre tests contaminaría el
    // estado (un test la deja REFUNDED y el siguiente ya no puede reembolsarla)
    let completedPayment: Payment;

    beforeEach(() => {
      completedPayment = new Payment({
        id: '123e4567-e89b-12d3-a456-426614174099',
        amount: 100.00,
        status: PaymentStatusEnum.COMPLETED,
        method: PaymentMethodEnum.CASH,
        paymentDate: new Date(),
        appointmentId: validAppointmentId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    });

    // Debería permitir a ADMIN reembolsar cualquier pago sin resolver la cita
    it('should allow ADMIN to refund any payment without resolving the appointment', async () => {
      mockPaymentRepository.findById.mockResolvedValue(completedPayment);
      mockPaymentRepository.update.mockImplementation(async (payment) => payment);

      const result = await refundPayment.execute(
        { paymentId: completedPayment.id },
        'any-admin-id',
        'ADMIN',
      );

      expect(result.status).toBe(PaymentStatusEnum.REFUNDED);
      expect(mockAppointmentRepository.findById).not.toHaveBeenCalled();
    });

    // Debería permitir al STYLIST dueño de la cita reembolsar el pago
    it('should allow the owning stylist to refund the payment', async () => {
      mockPaymentRepository.findById.mockResolvedValue(completedPayment);
      mockPaymentRepository.update.mockImplementation(async (payment) => payment);
      mockAppointmentRepository.findById.mockResolvedValue(mockAppointment as any);

      const result = await refundPayment.execute(
        { paymentId: completedPayment.id },
        validStylistId,
        'STYLIST',
      );

      expect(result.status).toBe(PaymentStatusEnum.REFUNDED);
    });

    // STYLIST ajeno a la cita no debe poder acceder al pago
    it('should throw ForbiddenError when stylist does not own the appointment', async () => {
      mockPaymentRepository.findById.mockResolvedValue(completedPayment);
      mockAppointmentRepository.findById.mockResolvedValue(mockAppointment as any);

      await expect(
        refundPayment.execute(
          { paymentId: completedPayment.id },
          'other-stylist-id',
          'STYLIST',
        ),
      ).rejects.toThrow(ForbiddenError);

      expect(mockPaymentRepository.update).not.toHaveBeenCalled();
    });

    // CLIENT no tiene acceso a esta operación bajo ninguna circunstancia
    it('should throw ForbiddenError for CLIENT regardless of ownership', async () => {
      mockPaymentRepository.findById.mockResolvedValue(completedPayment);

      await expect(
        refundPayment.execute(
          { paymentId: completedPayment.id },
          mockAppointment.clientId,
          'CLIENT',
        ),
      ).rejects.toThrow(ForbiddenError);

      expect(mockAppointmentRepository.findById).not.toHaveBeenCalled();
      expect(mockPaymentRepository.update).not.toHaveBeenCalled();
    });

    // Debería lanzar NotFoundError si la cita asociada al pago ya no existe
    it('should throw NotFoundError when the associated appointment no longer exists', async () => {
      mockPaymentRepository.findById.mockResolvedValue(completedPayment);
      mockAppointmentRepository.findById.mockResolvedValue(null);

      await expect(
        refundPayment.execute(
          { paymentId: completedPayment.id },
          validStylistId,
          'STYLIST',
        ),
      ).rejects.toThrow(NotFoundError);
    });
  });
});
