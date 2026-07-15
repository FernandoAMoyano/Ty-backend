import { ValidationError } from '../exceptions/ValidationError';

/**
 * Regex general de UUID, sin restricción de versión ni variante
 * @description A diferencia de validadores más estrictos (que exigen versión 1-5 y
 * variante 8/9/a/b), esta regex acepta cualquier UUID con formato válido. Es la misma
 * convención que usa express-validator/validator.js cuando se llama a isUUID() sin
 * especificar versión (modo "all").
 */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Valida que un string sea un UUID válido, lanzando ValidationError si no lo es
 * @param value - Valor a validar
 * @param fieldName - Nombre del campo, usado en los mensajes de error
 * @throws ValidationError si el valor está vacío o no tiene formato de UUID válido
 * @description Helper compartido para unificar la validación de UUID duplicada en
 * múltiples use cases (F12). Reemplaza los métodos privados validateUuid/validateInput
 * que repetían la misma regex con mensajes ligeramente distintos en appointments,
 * notifications y auth.
 */
export function assertValidUuid(value: string, fieldName: string): void {
  if (!value || value.trim().length === 0) {
    throw new ValidationError(`${fieldName} is required`);
  }

  if (!UUID_REGEX.test(value)) {
    throw new ValidationError(`${fieldName} must be a valid UUID`);
  }
}
