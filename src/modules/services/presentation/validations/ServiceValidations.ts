import { body, param } from 'express-validator';

/**
 * Validaciones para operaciones relacionadas con servicios del salón
 * Define reglas complejas de validación incluyendo validaciones cruzadas entre campos
 */
export class ServiceValidations {
  /**
   * Validaciones para crear un nuevo servicio
   * @description Valida todos los campos requeridos con reglas de negocio específicas
   * @rules
   * - categoryId: UUID válido requerido
   * - name: string 1-150 caracteres
   * - description: string 1-1000 caracteres
   * - duration: entero 1-600 minutos
   * - durationVariation: entero no negativo, no mayor que duration
   * - price: float no negativo, convertido a centavos
   */
  static createService = [
    body('categoryId').isUUID().withMessage('Category ID must be a valid UUID'),

    body('name')
      .isString()
      .withMessage('Name must be a string')
      .trim()
      .isLength({ min: 1, max: 150 })
      .withMessage('Name must be between 1 and 150 characters'),

    body('description')
      .isString()
      .withMessage('Description must be a string')
      .trim()
      .isLength({ min: 1, max: 1000 })
      .withMessage('Description must be between 1 and 1000 characters'),

    body('duration')
      .isInt({ min: 1, max: 600 })
      .withMessage('Duration must be an integer between 1 and 600 minutes'),

    body('durationVariation')
      .isInt({ min: 0 })
      .withMessage('Duration variation must be a non-negative integer')
      .custom((value, { req }) => {
        if (value > req.body.duration) {
          throw new Error('Duration variation cannot exceed base duration');
        }
        return true;
      }),

    body('price')
      .isFloat({ min: 0 })
      .withMessage('Price must be a non-negative number')
      .customSanitizer((value) => Math.round(value * 100)), // Convert to cents
  ];

  /**
   * Validaciones para actualizar un servicio existente
   * @description Valida UUID del parámetro y campos opcionales de actualización
   * @rules
   * - id: UUID válido requerido en parámetros
   * - Todos los campos de creación pero opcionales
   * - Mantiene validación cruzada para durationVariation
   */
  static updateService = [
    param('id').isUUID().withMessage('Service ID must be a valid UUID'),

    body('categoryId').optional().isUUID().withMessage('Category ID must be a valid UUID'),

    body('name')
      .optional()
      .isString()
      .withMessage('Name must be a string')
      .trim()
      .isLength({ min: 1, max: 150 })
      .withMessage('Name must be between 1 and 150 characters'),

    body('description')
      .optional()
      .isString()
      .withMessage('Description must be a string')
      .trim()
      .isLength({ min: 1, max: 1000 })
      .withMessage('Description must be between 1 and 1000 characters'),

    body('duration')
      .optional()
      .isInt({ min: 1, max: 600 })
      .withMessage('Duration must be an integer between 1 and 600 minutes'),

    body('durationVariation')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Duration variation must be a non-negative integer'),

    body('price')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Price must be a non-negative number')
      .customSanitizer((value) => (value ? Math.round(value * 100) : value)), // Convert to cents
  ];

  /**
   * Validación para operaciones que requieren ID de servicio
   * @description Valida que el parámetro ID sea un UUID válido
   */
  static serviceById = [param('id').isUUID().withMessage('Service ID must be a valid UUID')];

  /**
   * Validación para operaciones que requieren ID de categoría
   * @description Valida que el parámetro categoryId sea un UUID válido
   */
  static servicesByCategory = [
    param('categoryId').isUUID().withMessage('Category ID must be a valid UUID'),
  ];
}
