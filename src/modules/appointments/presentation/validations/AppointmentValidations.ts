import { body, param, query } from 'express-validator';

/**
 * Validaciones para operaciones relacionadas con citas del sistema
 * Define reglas completas de validación incluyendo validaciones de negocio específicas
 */
export class AppointmentValidations {
  /**
   * Validaciones para crear una nueva cita
   * @description Valida todos los campos requeridos con reglas de negocio específicas
   * @rules
   * - dateTime: fecha ISO válida en el futuro
   * - clientId: UUID válido requerido
   * - stylistId: UUID válido opcional
   * - serviceIds: array de UUIDs válidos, mínimo 1
   * - duration: entero positivo opcional en minutos
   */
  static createAppointment = [
    body('dateTime')
      .isISO8601()
      .withMessage('DateTime must be a valid ISO 8601 date')
      .custom((value) => {
        const appointmentDate = new Date(value);
        const now = new Date();

        if (appointmentDate <= now) {
          throw new Error('Appointment cannot be scheduled in the past');
        }

        // Validar que no sea más de 6 meses en el futuro
        const sixMonthsFromNow = new Date();
        sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);

        if (appointmentDate > sixMonthsFromNow) {
          throw new Error('Appointment cannot be scheduled more than 6 months in advance');
        }

        return true;
      }),

    body('clientId').isUUID().withMessage('Client ID must be a valid UUID'),

    body('stylistId').optional().isUUID().withMessage('Stylist ID must be a valid UUID'),

    body('serviceIds')
      .isArray({ min: 1 })
      .withMessage('At least one service must be selected')
      .custom((serviceIds) => {
        if (!Array.isArray(serviceIds) || serviceIds.length === 0) {
          throw new Error('Service IDs must be a non-empty array');
        }

        // Validar que todos los elementos sean UUIDs válidos
        const uuidRegex =
          /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        for (const serviceId of serviceIds) {
          if (!uuidRegex.test(serviceId)) {
            throw new Error('All service IDs must be valid UUIDs');
          }
        }

        return true;
      }),

    body('duration')
      .optional()
      .isInt({ min: 15, max: 480 })
      .withMessage('Duration must be between 15 and 480 minutes')
      .custom((value) => {
        if (value && value % 15 !== 0) {
          throw new Error('Duration must be in 15-minute increments');
        }
        return true;
      }),
  ];

  /**
   * Validaciones para actualizar una cita existente
   * @description Valida UUID del parámetro y campos opcionales de actualización
   * @rules
   * - id: UUID válido requerido en parámetros
   * - Todos los campos de creación pero opcionales
   * - Mantiene todas las validaciones de negocio
   * - Incluye validaciones para nuevos campos como notes y reason
   */
  static updateAppointment = [
    param('id').isUUID().withMessage('Appointment ID must be a valid UUID'),

    body('dateTime')
      .optional()
      .isISO8601()
      .withMessage('DateTime must be a valid ISO 8601 date')
      .custom((value) => {
        if (!value) return true; // Campo opcional

        const appointmentDate = new Date(value);
        const now = new Date();

        if (appointmentDate <= now) {
          throw new Error('Appointment cannot be rescheduled to the past');
        }

        const sixMonthsFromNow = new Date();
        sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);

        if (appointmentDate > sixMonthsFromNow) {
          throw new Error('Appointment cannot be scheduled more than 6 months in advance');
        }

        return true;
      }),

    body('duration')
      .optional()
      .isInt({ min: 15, max: 480 })
      .withMessage('Duration must be between 15 and 480 minutes')
      .custom((value) => {
        if (value && value % 15 !== 0) {
          throw new Error('Duration must be in 15-minute increments');
        }
        return true;
      }),

    body('stylistId')
      .optional()
      .custom((value) => {
        // Permitir null o undefined para quitar el estilista
        if (value === null || value === undefined || value === '') {
          return true;
        }

        // Si se proporciona un valor, debe ser un UUID válido
        const uuidRegex =
          /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(value)) {
          throw new Error('Stylist ID must be a valid UUID or null');
        }

        return true;
      }),

    body('serviceIds')
      .optional()
      .isArray({ min: 1 })
      .withMessage('At least one service must be selected')
      .custom((serviceIds) => {
        if (!serviceIds) return true; // Campo opcional

        if (!Array.isArray(serviceIds) || serviceIds.length === 0) {
          throw new Error('Service IDs must be a non-empty array');
        }

        const uuidRegex =
          /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        for (const serviceId of serviceIds) {
          if (!uuidRegex.test(serviceId)) {
            throw new Error('All service IDs must be valid UUIDs');
          }
        }

        return true;
      }),

    body('notes')
      .optional()
      .isString()
      .withMessage('Notes must be a string')
      .trim()
      .isLength({ min: 1, max: 500 })
      .withMessage('Notes must be between 1 and 500 characters'),

    body('reason')
      .optional()
      .isString()
      .withMessage('Reason must be a string')
      .trim()
      .isLength({ min: 1, max: 300 })
      .withMessage('Reason must be between 1 and 300 characters'),

    body('notifyClient')
      .optional()
      .isBoolean()
      .withMessage('Notify client must be a boolean value'),

    // Validación personalizada para asegurar que al menos un campo esté presente
    body().custom((body) => {
      const allowedFields = [
        'dateTime',
        'duration',
        'stylistId',
        'serviceIds',
        'notes',
        'reason',
        'notifyClient',
      ];
      const hasValidUpdate = allowedFields.some((field) => body[field] !== undefined);

      if (!hasValidUpdate) {
        throw new Error('At least one field must be provided for update');
      }

      return true;
    }),
  ];

  /**
   * Validación para operaciones que requieren ID de cita
   * @description Valida que el parámetro ID sea un UUID válido
   */
  static appointmentById = [
    param('id').isUUID().withMessage('Appointment ID must be a valid UUID'),
  ];

  /**
   * Validaciones para buscar citas por cliente
   * @description Valida que el parámetro clientId sea un UUID válido
   */
  static appointmentsByClient = [
    param('clientId').isUUID().withMessage('Client ID must be a valid UUID'),
  ];

  /**
   * Validaciones para buscar citas por estilista
   * @description Valida que el parámetro stylistId sea un UUID válido
   */
  static appointmentsByStylist = [
    param('stylistId').isUUID().withMessage('Stylist ID must be a valid UUID'),
  ];

  /**
   * Validaciones para buscar citas por rango de fechas
   * @description Valida fechas de inicio y fin en query parameters
   */
  static appointmentsByDateRange = [
    query('startDate').isISO8601().withMessage('Start date must be a valid ISO 8601 date'),

    query('endDate')
      .isISO8601()
      .withMessage('End date must be a valid ISO 8601 date')
      .custom((endDate, { req }) => {
        // Validación segura de query parameters
        if (!req.query || !req.query.startDate) {
          throw new Error('Start date is required for end date validation');
        }

        const startDate = new Date(req.query.startDate as string);
        const end = new Date(endDate);

        if (end <= startDate) {
          throw new Error('End date must be after start date');
        }

        // Limitar rango máximo a 1 año
        const oneYearFromStart = new Date(startDate);
        oneYearFromStart.setFullYear(oneYearFromStart.getFullYear() + 1);

        if (end > oneYearFromStart) {
          throw new Error('Date range cannot exceed 1 year');
        }

        return true;
      }),
  ];

  /**
   * Validaciones para confirmar una cita
   * @description Valida UUID del parámetro y datos opcionales de confirmación
   */
  static confirmAppointment = [
    param('id').isUUID().withMessage('Appointment ID must be a valid UUID'),

    body('notes')
      .optional()
      .isString()
      .withMessage('Confirmation notes must be a string')
      .trim()
      .isLength({ max: 500 })
      .withMessage('Confirmation notes cannot exceed 500 characters'),

    body('notifyClient')
      .optional()
      .isBoolean()
      .withMessage('Notify client must be a boolean value'),

    body('confirmedBy').optional().isUUID().withMessage('Confirmed by ID must be a valid UUID'),
  ];

  /**
   * Validaciones para cancelar una cita
   * @description Valida UUID del parámetro y datos opcionales de cancelación
   */
  static cancelAppointment = [
    param('id').isUUID().withMessage('Appointment ID must be a valid UUID'),

    body('reason')
      .optional()
      .isString()
      .withMessage('Cancellation reason must be a string')
      .trim()
      .isLength({ max: 500 })
      .withMessage('Cancellation reason cannot exceed 500 characters'),

    body('cancelledBy')
      .optional()
      .isIn(['client', 'stylist', 'admin', 'system'])
      .withMessage('Cancelled by must be one of: client, stylist, admin, system'),

    body('notifyClient')
      .optional()
      .isBoolean()
      .withMessage('Notify client must be a boolean value'),
  ];

  /**
   * Validaciones para obtener slots disponibles
   * @description Valida fecha y parámetros opcionales para disponibilidad
   */
  static getAvailableSlots = [
    query('date')
      .isISO8601()
      .withMessage('Date must be a valid ISO 8601 date')
      .custom((value) => {
        const date = new Date(value);
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        if (date < now) {
          throw new Error('Cannot check availability for past dates');
        }

        return true;
      }),

    query('duration')
      .optional()
      .isInt({ min: 15, max: 480 })
      .withMessage('Duration must be between 15 and 480 minutes')
      .custom((value) => {
        if (value && value % 15 !== 0) {
          throw new Error('Duration must be in 15-minute increments');
        }
        return true;
      }),

    query('stylistId').optional().isUUID().withMessage('Stylist ID must be a valid UUID'),
  ];
}
