import { body, param } from 'express-validator';

export class StylistServiceValidations {
  static assignService = [
    param('stylistId').isUUID().withMessage('Stylist ID must be a valid UUID'),

    body('serviceId').isUUID().withMessage('Service ID must be a valid UUID'),

    body('customPrice')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Custom price must be a non-negative number')
      .customSanitizer((value) => (value ? Math.round(value * 100) : undefined)), // Convert to cents
  ];

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

  static stylistServiceParams = [
    param('stylistId').isUUID().withMessage('Stylist ID must be a valid UUID'),

    param('serviceId').isUUID().withMessage('Service ID must be a valid UUID'),
  ];

  static stylistById = [param('stylistId').isUUID().withMessage('Stylist ID must be a valid UUID')];

  static serviceById = [param('serviceId').isUUID().withMessage('Service ID must be a valid UUID')];
}
