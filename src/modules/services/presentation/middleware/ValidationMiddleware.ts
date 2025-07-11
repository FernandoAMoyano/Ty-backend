import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { ValidationError } from '../../../../shared/exceptions/ValidationError';

/**
 * Middleware para el manejo centralizado de errores de validación
 * Procesa los resultados de express-validator y convierte errores en excepciones tipadas
 */
export class ValidationMiddleware {
  /**
   * Middleware que procesa errores de validación de express-validator
   * @param req - Request de Express con datos a validar
   * @param res - Response de Express
   * @param next - NextFunction para continuar o pasar errores
   * @returns void
   * @description Recopila errores de validación y los convierte en ValidationError
   * @throws ValidationError si hay errores de validación en la petición
   */
  static handleValidationErrors = (req: Request, res: Response, next: NextFunction): void => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map((error) => error.msg);
      throw new ValidationError(errorMessages.join(', '));
    }

    next();
  };
}
