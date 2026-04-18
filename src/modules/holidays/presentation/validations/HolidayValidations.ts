import { body, param, query } from 'express-validator';

/**
 * Validaciones para el módulo de feriados
 * @description Define las reglas de validación para los endpoints de holidays
 */
export class HolidayValidations {
  // =====================
  // HOLIDAY VALIDATIONS
  // =====================

  /**
   * Validación para crear un feriado
   */
  static create = [
    body('name')
      .notEmpty()
      .withMessage('El nombre es requerido')
      .isString()
      .withMessage('El nombre debe ser una cadena de texto')
      .isLength({ max: 100 })
      .withMessage('El nombre no puede exceder 100 caracteres'),

    body('date')
      .notEmpty()
      .withMessage('La fecha es requerida')
      .isISO8601()
      .withMessage('La fecha debe tener formato ISO 8601 (YYYY-MM-DD)'),

    body('description')
      .optional()
      .isString()
      .withMessage('La descripción debe ser una cadena de texto')
      .isLength({ max: 500 })
      .withMessage('La descripción no puede exceder 500 caracteres'),
  ];

  /**
   * Validación para actualizar un feriado
   */
  static update = [
    param('id')
      .isUUID()
      .withMessage('El ID debe ser un UUID válido'),

    body('name')
      .optional()
      .isString()
      .withMessage('El nombre debe ser una cadena de texto')
      .isLength({ min: 1, max: 100 })
      .withMessage('El nombre debe tener entre 1 y 100 caracteres'),

    body('date')
      .optional()
      .isISO8601()
      .withMessage('La fecha debe tener formato ISO 8601 (YYYY-MM-DD)'),

    body('description')
      .optional({ nullable: true })
      .isString()
      .withMessage('La descripción debe ser una cadena de texto')
      .isLength({ max: 500 })
      .withMessage('La descripción no puede exceder 500 caracteres'),
  ];

  /**
   * Validación para obtener por ID
   */
  static getById = [
    param('id')
      .isUUID()
      .withMessage('El ID debe ser un UUID válido'),
  ];

  /**
   * Validación para eliminar
   */
  static delete = [
    param('id')
      .isUUID()
      .withMessage('El ID debe ser un UUID válido'),
  ];

  /**
   * Validación para obtener por año
   */
  static getByYear = [
    param('year')
      .isInt({ min: 2000, max: 2100 })
      .withMessage('El año debe ser un número entre 2000 y 2100'),
  ];

  /**
   * Validación para verificar fecha
   */
  static checkDate = [
    param('date')
      .isISO8601()
      .withMessage('La fecha debe tener formato ISO 8601 (YYYY-MM-DD)'),
  ];

  /**
   * Validación para filtros de listado
   */
  static getAll = [
    query('year')
      .optional()
      .isInt({ min: 2000, max: 2100 })
      .withMessage('El año debe ser un número entre 2000 y 2100'),

    query('month')
      .optional()
      .isInt({ min: 1, max: 12 })
      .withMessage('El mes debe ser un número entre 1 y 12'),

    query('startDate')
      .optional()
      .isISO8601()
      .withMessage('startDate debe tener formato ISO 8601'),

    query('endDate')
      .optional()
      .isISO8601()
      .withMessage('endDate debe tener formato ISO 8601'),

    query('name')
      .optional()
      .isString()
      .withMessage('El nombre debe ser una cadena de texto'),

    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('La página debe ser un número mayor a 0'),

    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('El límite debe ser un número entre 1 y 100'),
  ];

  /**
   * Validación para obtener próximos
   */
  static getUpcoming = [
    query('limit')
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage('El límite debe ser un número entre 1 y 50'),
  ];

  // =====================
  // SCHEDULE EXCEPTION VALIDATIONS
  // =====================

  /**
   * Validación para crear una excepción de horario
   */
  static createException = [
    body('exceptionDate')
      .notEmpty()
      .withMessage('La fecha de excepción es requerida')
      .isISO8601()
      .withMessage('La fecha debe tener formato ISO 8601 (YYYY-MM-DD)'),

    body('startTimeException')
      .notEmpty()
      .withMessage('La hora de inicio es requerida')
      .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage('La hora de inicio debe tener formato HH:MM'),

    body('endTimeException')
      .notEmpty()
      .withMessage('La hora de fin es requerida')
      .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage('La hora de fin debe tener formato HH:MM'),

    body('reason')
      .optional()
      .isString()
      .withMessage('La razón debe ser una cadena de texto')
      .isLength({ max: 500 })
      .withMessage('La razón no puede exceder 500 caracteres'),

    body('holidayId')
      .optional()
      .isUUID()
      .withMessage('El holidayId debe ser un UUID válido'),
  ];

  /**
   * Validación para actualizar una excepción de horario
   */
  static updateException = [
    param('id')
      .isUUID()
      .withMessage('El ID debe ser un UUID válido'),

    body('exceptionDate')
      .optional()
      .isISO8601()
      .withMessage('La fecha debe tener formato ISO 8601 (YYYY-MM-DD)'),

    body('startTimeException')
      .optional()
      .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage('La hora de inicio debe tener formato HH:MM'),

    body('endTimeException')
      .optional()
      .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage('La hora de fin debe tener formato HH:MM'),

    body('reason')
      .optional({ nullable: true })
      .isString()
      .withMessage('La razón debe ser una cadena de texto')
      .isLength({ max: 500 })
      .withMessage('La razón no puede exceder 500 caracteres'),

    body('holidayId')
      .optional({ nullable: true })
      .isUUID()
      .withMessage('El holidayId debe ser un UUID válido'),
  ];

  /**
   * Validación para obtener excepción por ID
   */
  static getExceptionById = [
    param('id')
      .isUUID()
      .withMessage('El ID debe ser un UUID válido'),
  ];

  /**
   * Validación para eliminar excepción
   */
  static deleteException = [
    param('id')
      .isUUID()
      .withMessage('El ID debe ser un UUID válido'),
  ];

  /**
   * Validación para obtener excepciones por feriado
   */
  static getExceptionsByHoliday = [
    param('holidayId')
      .isUUID()
      .withMessage('El holidayId debe ser un UUID válido'),
  ];

  /**
   * Validación para filtros de excepciones
   */
  static getAllExceptions = [
    query('startDate')
      .optional()
      .isISO8601()
      .withMessage('startDate debe tener formato ISO 8601'),

    query('endDate')
      .optional()
      .isISO8601()
      .withMessage('endDate debe tener formato ISO 8601'),

    query('holidayId')
      .optional()
      .isUUID()
      .withMessage('El holidayId debe ser un UUID válido'),

    query('reason')
      .optional()
      .isString()
      .withMessage('La razón debe ser una cadena de texto'),

    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('La página debe ser un número mayor a 0'),

    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('El límite debe ser un número entre 1 y 100'),
  ];

  /**
   * Validación para obtener próximas excepciones
   */
  static getUpcomingExceptions = [
    query('limit')
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage('El límite debe ser un número entre 1 y 50'),
  ];
}
