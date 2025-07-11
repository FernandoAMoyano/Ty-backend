import { body, param } from 'express-validator';

/**
 * Validaciones para operaciones de asignación de servicios a estilistas
 * Define reglas específicas para la relación estilista-servicio incluyendo precios personalizados
 */
export class StylistServiceValidations {
  /**
   * Validaciones para asignar un servicio a un estilista
   * @description Valida IDs requeridos y precio personalizado opcional
   * @rules
   * - stylistId: UUID válido en parámetros
   * - serviceId: UUID válido en body
   * - customPrice: float opcional no negativo, convertido a centavos
   */
  static assignService = [
    param('stylistId').isUUID().withMessage('Stylist ID must be a valid UUID'),

    body('serviceId').isUUID().withMessage('Service ID must be a valid UUID'),

    body('customPrice')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Custom price must be a non-negative number')
      .customSanitizer((value) => (value ? Math.round(value * 100) : undefined)), // Convert to cents
  ];

  /**
   * Validaciones para actualizar una asignación estilista-servicio
   * @description Valida IDs en parámetros y campos opcionales de actualización
   * @rules
   * - stylistId: UUID válido en parámetros
   * - serviceId: UUID válido en parámetros
   * - customPrice: float opcional no negativo, convertido a centavos
   * - isOffering: boolean opcional para estado de oferta
   */
  static updateStylistService = [
    param('stylistId').isUUID().withMessage('Stylist ID must be a valid UUID'),

    param('serviceId').isUUID().withMessage('Service ID must be a valid UUID'),

    body('customPrice')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Custom price must be a non-negative number')
      .customSanitizer((value) => (value ? Math.round(value * 100) : undefined)), // Convert to cents

    body('isOffering').optional().isBoolean().withMessage('isOffering must be a boolean value'),
  ];

  /**
   * Validación para operaciones que requieren tanto stylistId como serviceId
   * @description Valida que ambos parámetros sean UUIDs válidos
   */
  static stylistServiceParams = [
    param('stylistId').isUUID().withMessage('Stylist ID must be a valid UUID'),

    param('serviceId').isUUID().withMessage('Service ID must be a valid UUID'),
  ];

  /**
   * Validación para operaciones que requieren solo ID de estilista
   * @description Valida que el parámetro stylistId sea un UUID válido
   */
  static stylistById = [param('stylistId').isUUID().withMessage('Stylist ID must be a valid UUID')];

  /**
   * Validación para operaciones que requieren solo ID de servicio
   * @description Valida que el parámetro serviceId sea un UUID válido
   */
  static serviceById = [param('serviceId').isUUID().withMessage('Service ID must be a valid UUID')];
}
