import {
  Payment,
  PaymentProps,
  PaymentStatusEnum,
  PaymentMethodEnum,
} from '../../../../../src/modules/payments/domain/entities/Payment';

describe('Payment Entity', () => {
  // Datos de prueba base
  const validPaymentProps: PaymentProps = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    amount: 100.5,
    status: PaymentStatusEnum.PENDING,
    method: null,
    paymentDate: null,
    appointmentId: '123e4567-e89b-12d3-a456-426614174001',
    createdAt: new Date('2025-01-01T10:00:00Z'),
    updatedAt: new Date('2025-01-01T10:00:00Z'),
  };

  describe('Constructor y Getters', () => {
    // Debería crear una entidad Payment con todas las propiedades
    it('should create a Payment entity with all properties', () => {
      const payment = new Payment(validPaymentProps);

      expect(payment.id).toBe(validPaymentProps.id);
      expect(payment.amount).toBe(validPaymentProps.amount);
      expect(payment.status).toBe(PaymentStatusEnum.PENDING);
      expect(payment.method).toBeNull();
      expect(payment.paymentDate).toBeNull();
      expect(payment.appointmentId).toBe(validPaymentProps.appointmentId);
      expect(payment.createdAt).toEqual(validPaymentProps.createdAt);
      expect(payment.updatedAt).toEqual(validPaymentProps.updatedAt);
    });

    // Debería crear una entidad Payment con método y fecha de pago
    it('should create a Payment entity with method and payment date', () => {
      const completedProps: PaymentProps = {
        ...validPaymentProps,
        status: PaymentStatusEnum.COMPLETED,
        method: PaymentMethodEnum.CREDIT_CARD,
        paymentDate: new Date('2025-01-01T12:00:00Z'),
      };

      const payment = new Payment(completedProps);

      expect(payment.status).toBe(PaymentStatusEnum.COMPLETED);
      expect(payment.method).toBe(PaymentMethodEnum.CREDIT_CARD);
      expect(payment.paymentDate).toEqual(completedProps.paymentDate);
    });
  });

  describe('Propiedades computadas de estado', () => {
    // Debería retornar isPending true cuando el estado es PENDING
    it('should return isPending true when status is PENDING', () => {
      const payment = new Payment(validPaymentProps);

      expect(payment.isPending).toBe(true);
      expect(payment.isCompleted).toBe(false);
      expect(payment.isRefunded).toBe(false);
      expect(payment.isFailed).toBe(false);
    });

    // Debería retornar isCompleted true cuando el estado es COMPLETED
    it('should return isCompleted true when status is COMPLETED', () => {
      const payment = new Payment({
        ...validPaymentProps,
        status: PaymentStatusEnum.COMPLETED,
      });

      expect(payment.isPending).toBe(false);
      expect(payment.isCompleted).toBe(true);
      expect(payment.isRefunded).toBe(false);
      expect(payment.isFailed).toBe(false);
    });

    // Debería retornar isRefunded true cuando el estado es REFUNDED
    it('should return isRefunded true when status is REFUNDED', () => {
      const payment = new Payment({
        ...validPaymentProps,
        status: PaymentStatusEnum.REFUNDED,
      });

      expect(payment.isPending).toBe(false);
      expect(payment.isCompleted).toBe(false);
      expect(payment.isRefunded).toBe(true);
      expect(payment.isFailed).toBe(false);
    });

    // Debería retornar isFailed true cuando el estado es FAILED
    it('should return isFailed true when status is FAILED', () => {
      const payment = new Payment({
        ...validPaymentProps,
        status: PaymentStatusEnum.FAILED,
      });

      expect(payment.isPending).toBe(false);
      expect(payment.isCompleted).toBe(false);
      expect(payment.isRefunded).toBe(false);
      expect(payment.isFailed).toBe(true);
    });
  });

  describe('markAsCompleted', () => {
    // Debería marcar el pago como completado con el método de pago
    it('should mark payment as completed with payment method', () => {
      const payment = new Payment(validPaymentProps);

      payment.markAsCompleted(PaymentMethodEnum.CASH);

      expect(payment.status).toBe(PaymentStatusEnum.COMPLETED);
      expect(payment.method).toBe(PaymentMethodEnum.CASH);
      expect(payment.paymentDate).toBeInstanceOf(Date);
      expect(payment.isCompleted).toBe(true);
    });

    // Debería lanzar error si el pago no está pendiente
    it('should throw error if payment is not pending', () => {
      const payment = new Payment({
        ...validPaymentProps,
        status: PaymentStatusEnum.COMPLETED,
      });

      expect(() => payment.markAsCompleted(PaymentMethodEnum.CASH)).toThrow(
        'Solo se pueden completar pagos pendientes',
      );
    });

    // Debería funcionar con todos los métodos de pago
    it('should work with all payment methods', () => {
      const methods = [
        PaymentMethodEnum.CASH,
        PaymentMethodEnum.CREDIT_CARD,
        PaymentMethodEnum.DEBIT_CARD,
        PaymentMethodEnum.TRANSFER,
        PaymentMethodEnum.ONLINE,
      ];

      methods.forEach((method) => {
        const payment = new Payment(validPaymentProps);
        payment.markAsCompleted(method);
        expect(payment.method).toBe(method);
      });
    });
  });

  describe('markAsFailed', () => {
    // Debería marcar el pago como fallido
    it('should mark payment as failed', () => {
      const payment = new Payment(validPaymentProps);

      payment.markAsFailed();

      expect(payment.status).toBe(PaymentStatusEnum.FAILED);
      expect(payment.isFailed).toBe(true);
    });

    // Debería lanzar error si el pago no está pendiente
    it('should throw error if payment is not pending', () => {
      const payment = new Payment({
        ...validPaymentProps,
        status: PaymentStatusEnum.COMPLETED,
      });

      expect(() => payment.markAsFailed()).toThrow(
        'Solo se pueden marcar como fallidos pagos pendientes',
      );
    });
  });

  describe('refund', () => {
    // Debería reembolsar un pago completado
    it('should refund a completed payment', () => {
      const payment = new Payment({
        ...validPaymentProps,
        status: PaymentStatusEnum.COMPLETED,
        method: PaymentMethodEnum.CREDIT_CARD,
        paymentDate: new Date(),
      });

      payment.refund();

      expect(payment.status).toBe(PaymentStatusEnum.REFUNDED);
      expect(payment.isRefunded).toBe(true);
    });

    // Debería lanzar error si el pago no está completado
    it('should throw error if payment is not completed', () => {
      const payment = new Payment(validPaymentProps);

      expect(() => payment.refund()).toThrow('Solo se pueden reembolsar pagos completados');
    });

    // Debería lanzar error si el pago ya fue reembolsado
    it('should throw error if payment is already refunded', () => {
      const payment = new Payment({
        ...validPaymentProps,
        status: PaymentStatusEnum.REFUNDED,
      });

      expect(() => payment.refund()).toThrow('Solo se pueden reembolsar pagos completados');
    });
  });

  describe('updateAmount', () => {
    // Debería actualizar el monto de un pago pendiente
    it('should update amount of a pending payment', () => {
      const payment = new Payment(validPaymentProps);
      const originalUpdatedAt = payment.updatedAt;

      // Esperar un momento para que updatedAt sea diferente
      payment.updateAmount(200.75);

      expect(payment.amount).toBe(200.75);
      expect(payment.updatedAt.getTime()).toBeGreaterThanOrEqual(originalUpdatedAt.getTime());
    });

    // Debería lanzar error si el pago no está pendiente
    it('should throw error if payment is not pending', () => {
      const payment = new Payment({
        ...validPaymentProps,
        status: PaymentStatusEnum.COMPLETED,
      });

      expect(() => payment.updateAmount(200)).toThrow(
        'Solo se puede actualizar el monto de pagos pendientes',
      );
    });

    // Debería lanzar error si el monto es 0
    it('should throw error if amount is 0', () => {
      const payment = new Payment(validPaymentProps);

      expect(() => payment.updateAmount(0)).toThrow('El monto debe ser mayor a 0');
    });

    // Debería lanzar error si el monto es negativo
    it('should throw error if amount is negative', () => {
      const payment = new Payment(validPaymentProps);

      expect(() => payment.updateAmount(-50)).toThrow('El monto debe ser mayor a 0');
    });
  });

  describe('toObject', () => {
    // Debería convertir la entidad a un objeto plano
    it('should convert entity to plain object', () => {
      const payment = new Payment(validPaymentProps);
      const obj = payment.toObject();

      expect(obj).toEqual({
        id: validPaymentProps.id,
        amount: validPaymentProps.amount,
        status: PaymentStatusEnum.PENDING,
        method: null,
        paymentDate: null,
        appointmentId: validPaymentProps.appointmentId,
        createdAt: validPaymentProps.createdAt,
        updatedAt: validPaymentProps.updatedAt,
      });
    });
  });

  describe('Factory method create', () => {
    // Debería crear un nuevo pago con estado PENDING
    it('should create a new payment with PENDING status', () => {
      const payment = Payment.create(
        '123e4567-e89b-12d3-a456-426614174000',
        150.0,
        '123e4567-e89b-12d3-a456-426614174001',
      );

      expect(payment.id).toBe('123e4567-e89b-12d3-a456-426614174000');
      expect(payment.amount).toBe(150.0);
      expect(payment.status).toBe(PaymentStatusEnum.PENDING);
      expect(payment.method).toBeNull();
      expect(payment.paymentDate).toBeNull();
      expect(payment.appointmentId).toBe('123e4567-e89b-12d3-a456-426614174001');
      expect(payment.createdAt).toBeInstanceOf(Date);
      expect(payment.updatedAt).toBeInstanceOf(Date);
    });

    // Debería lanzar error si el monto es 0
    it('should throw error if amount is 0', () => {
      expect(() =>
        Payment.create(
          '123e4567-e89b-12d3-a456-426614174000',
          0,
          '123e4567-e89b-12d3-a456-426614174001',
        ),
      ).toThrow('El monto debe ser mayor a 0');
    });

    // Debería lanzar error si el monto es negativo
    it('should throw error if amount is negative', () => {
      expect(() =>
        Payment.create(
          '123e4567-e89b-12d3-a456-426614174000',
          -100,
          '123e4567-e89b-12d3-a456-426614174001',
        ),
      ).toThrow('El monto debe ser mayor a 0');
    });
  });

  describe('Enums', () => {
    // Debería tener todos los valores de PaymentStatusEnum
    it('should have all PaymentStatusEnum values', () => {
      expect(PaymentStatusEnum.PENDING).toBe('PENDING');
      expect(PaymentStatusEnum.COMPLETED).toBe('COMPLETED');
      expect(PaymentStatusEnum.REFUNDED).toBe('REFUNDED');
      expect(PaymentStatusEnum.FAILED).toBe('FAILED');
    });

    // Debería tener todos los valores de PaymentMethodEnum
    it('should have all PaymentMethodEnum values', () => {
      expect(PaymentMethodEnum.CASH).toBe('CASH');
      expect(PaymentMethodEnum.CREDIT_CARD).toBe('CREDIT_CARD');
      expect(PaymentMethodEnum.DEBIT_CARD).toBe('DEBIT_CARD');
      expect(PaymentMethodEnum.TRANSFER).toBe('TRANSFER');
      expect(PaymentMethodEnum.ONLINE).toBe('ONLINE');
    });
  });
});
