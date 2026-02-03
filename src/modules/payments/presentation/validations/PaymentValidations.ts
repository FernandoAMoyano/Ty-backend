import { body, param, query } from 'express-validator';

/**
 * Validaciones para el módulo de pagos
 */
export class PaymentValidations {
  /**
   * Validación para crear un pago
   */
  static createPayment = [
    body('amount')
      .notEmpty()
      .withMessage('El monto es requerido')
      .isFloat({ min: 0.01 })
      .withMessage('El monto debe ser mayor a 0'),
    body('appointmentId')
      .notEmpty()
      .withMessage('El ID de la cita es requerido')
      .isUUID()
      .withMessage('El ID de la cita debe ser un UUID válido'),
  ];

  /**
   * Validación para procesar un pago
   */
  static processPayment = [
    param('id')
      .isUUID()
      .withMessage('El ID del pago debe ser un UUID válido'),
    body('method')
      .notEmpty()
      .withMessage('El método de pago es requerido')
      .isIn(['CASH', 'CREDIT_CARD', 'DEBIT_CARD', 'TRANSFER', 'ONLINE'])
      .withMessage('El método de pago debe ser válido (CASH, CREDIT_CARD, DEBIT_CARD, TRANSFER, ONLINE)'),
  ];

  /**
   * Validación para reembolsar un pago
   */
  static refundPayment = [
    param('id')
      .isUUID()
      .withMessage('El ID del pago debe ser un UUID válido'),
    body('reason')
      .optional()
      .isString()
      .withMessage('La razón debe ser un texto')
      .isLength({ max: 500 })
      .withMessage('La razón no puede exceder 500 caracteres'),
  ];

  /**
   * Validación para obtener pago por ID
   */
  static paymentById = [
    param('id')
      .isUUID()
      .withMessage('El ID del pago debe ser un UUID válido'),
  ];

  /**
   * Validación para obtener pagos por cita
   */
  static paymentsByAppointment = [
    param('appointmentId')
      .isUUID()
      .withMessage('El ID de la cita debe ser un UUID válido'),
  ];

  /**
   * Validación para listar pagos
   */
  static getPayments = [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('La página debe ser un número entero mayor a 0'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('El límite debe ser un número entre 1 y 100'),
    query('status')
      .optional()
      .isIn(['PENDING', 'COMPLETED', 'REFUNDED', 'FAILED'])
      .withMessage('El estado debe ser válido (PENDING, COMPLETED, REFUNDED, FAILED)'),
    query('appointmentId')
      .optional()
      .isUUID()
      .withMessage('El ID de la cita debe ser un UUID válido'),
    query('startDate')
      .optional()
      .isISO8601()
      .withMessage('La fecha de inicio debe ser una fecha válida'),
    query('endDate')
      .optional()
      .isISO8601()
      .withMessage('La fecha de fin debe ser una fecha válida'),
  ];

  /**
   * Validación para estadísticas
   */
  static getStatistics = [
    query('startDate')
      .optional()
      .isISO8601()
      .withMessage('La fecha de inicio debe ser una fecha válida'),
    query('endDate')
      .optional()
      .isISO8601()
      .withMessage('La fecha de fin debe ser una fecha válida'),
  ];

  /**
   * Validación para actualizar un pago
   */
  static updatePayment = [
    param('id')
      .isUUID()
      .withMessage('El ID del pago debe ser un UUID válido'),
    body('amount')
      .optional()
      .isFloat({ min: 0.01 })
      .withMessage('El monto debe ser mayor a 0'),
  ];
}
