import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { ValidationError } from '../../../../shared/exceptions/ValidationError';

export class ValidationMiddleware {
  static handleValidationErrors = (req: Request, res: Response, next: NextFunction): void => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map((error) => error.msg);
      throw new ValidationError(errorMessages.join(', '));
    }

    next();
  };
}
