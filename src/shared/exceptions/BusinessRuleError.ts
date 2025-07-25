import { AppError } from './AppError';

/**
 * Error que se lanza cuando una operación viola las reglas de negocio del sistema
 * Usado para validaciones de lógica de negocio que no son errores de validación técnica
 * 
 * Ejemplos:
 * - Intentar cancelar una cita que ya ocurrió
 * - Transferir dinero cuando no hay fondos suficientes
 * - Cambiar estado de una entidad cuando no está permitido
 * - Realizar acciones fuera de horarios permitidos
 */
export class BusinessRuleError extends AppError {
  /**
   * Información adicional opcional sobre el error
   */
  public readonly details?: any;

  /**
   * Crea una nueva instancia de error de regla de negocio
   * @param message - Mensaje descriptivo del error de negocio
   * @param details - Información adicional opcional sobre el error
   */
  constructor(message: string, details?: any) {
    super(message, 422, 'BUSINESS_RULE_ERROR');
    this.name = 'BusinessRuleError';
    this.details = details;
  }
}
