import { body, param } from 'express-validator';

/**
 * Validaciones para operaciones relacionadas con categorías de servicios
 * Define reglas de validación usando express-validator para asegurar integridad de datos
 */
export class CategoryValidations {
  /**
   * Validaciones para crear una nueva categoría
   * @description Valida nombre requerido, longitud y formato, descripción opcional
   * @rules
   * - name: string requerido, 1-100 caracteres, solo letras y espacios
   * - description: string opcional, máximo 500 caracteres
   */
  static createCategory = [
    body('name')
      .isString()
      .withMessage('Name must be a string')
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Name must be between 1 and 100 characters')
      .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
      .withMessage('Name can only contain letters and spaces'),

    body('description')
      .optional()
      .isString()
      .withMessage('Description must be a string')
      .trim()
      .isLength({ max: 500 })
      .withMessage('Description cannot exceed 500 characters'),
  ];

  /**
   * Validaciones para actualizar una categoría existente
   * @description Valida UUID del parámetro y campos opcionales de actualización
   * @rules
   * - id: UUID válido requerido en parámetros
   * - name: string opcional, 1-100 caracteres, solo letras y espacios
   * - description: string opcional, máximo 500 caracteres
   */
  static updateCategory = [
    param('id').isUUID().withMessage('Category ID must be a valid UUID'),

    body('name')
      .optional()
      .isString()
      .withMessage('Name must be a string')
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Name must be between 1 and 100 characters')
      .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
      .withMessage('Name can only contain letters and spaces'),

    body('description')
      .optional()
      .isString()
      .withMessage('Description must be a string')
      .trim()
      .isLength({ max: 500 })
      .withMessage('Description cannot exceed 500 characters'),
  ];

  /**
   * Validación para operaciones que requieren ID de categoría
   * @description Valida que el parámetro ID sea un UUID válido
   * @rules
   * - id: UUID válido requerido en parámetros de ruta
   */
  static categoryById = [param('id').isUUID().withMessage('Category ID must be a valid UUID')];
}
