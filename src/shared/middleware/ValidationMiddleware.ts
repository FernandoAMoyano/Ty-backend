import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { ValidationError } from '../exceptions/ValidationError';

/**
 * Middleware compartido para el manejo centralizado de errores de validación
 * Procesa los resultados de express-validator y convierte errores en excepciones tipadas
 * Disponible para todos los módulos del sistema
 */
export class ValidationMiddleware {
  /**
   * Middleware estático que procesa errores de validación de express-validator
   * @param req - Request de Express con datos a validar
   * @param res - Response de Express
   * @param next - NextFunction para continuar o pasar errores
   * @returns void
   * @description Recopila errores de validación y los convierte en ValidationError tipado
   * @throws ValidationError si hay errores de validación en la petición
   */
  static handleValidationErrors = (req: Request, res: Response, next: NextFunction): void => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map((error) => {
        const errorAny = error as any;
        const field = errorAny.path || errorAny.param || errorAny.location || 'field';
        return `${field}: ${error.msg}`;
      });

      throw new ValidationError(`Validation failed: ${errorMessages.join(', ')}`);
    }

    next();
  };
}
