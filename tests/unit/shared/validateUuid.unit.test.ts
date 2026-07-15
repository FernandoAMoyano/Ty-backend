import { assertValidUuid } from '../../../src/shared/utils/validateUuid';
import { ValidationError } from '../../../src/shared/exceptions/ValidationError';

describe('assertValidUuid Unit Tests (F12)', () => {
  // Debería aceptar un UUID válido sin lanzar error
  it('should not throw for a valid UUID', () => {
    expect(() => assertValidUuid('123e4567-e89b-12d3-a456-426614174000', 'Test ID')).not.toThrow();
  });

  // Debería aceptar UUIDs con versión y variante fuera del rango estricto 1-5/8-9-a-b
  // (regex general, sin restricción de versión ni variante, a diferencia de los
  // validadores previos duplicados por use case)
  it('should not throw for a UUID with a non-standard version/variant nibble', () => {
    expect(() =>
      assertValidUuid('00000000-0000-0000-0000-000000000000', 'Test ID'),
    ).not.toThrow();
  });

  // Debería aceptar UUIDs en mayúsculas
  it('should not throw for an uppercase UUID', () => {
    expect(() =>
      assertValidUuid('123E4567-E89B-12D3-A456-426614174000', 'Test ID'),
    ).not.toThrow();
  });

  // Debería lanzar ValidationError con mensaje "is required" para string vacío
  it('should throw ValidationError with "is required" message for an empty string', () => {
    expect(() => assertValidUuid('', 'Test ID')).toThrow(ValidationError);
    expect(() => assertValidUuid('', 'Test ID')).toThrow('Test ID is required');
  });

  // Debería lanzar ValidationError con mensaje "is required" para string en blanco
  it('should throw ValidationError with "is required" message for a whitespace-only string', () => {
    expect(() => assertValidUuid('   ', 'Test ID')).toThrow('Test ID is required');
  });

  // Debería lanzar ValidationError con mensaje "must be a valid UUID" para formato inválido
  it('should throw ValidationError with "must be a valid UUID" message for an invalid format', () => {
    expect(() => assertValidUuid('not-a-uuid', 'Test ID')).toThrow(ValidationError);
    expect(() => assertValidUuid('not-a-uuid', 'Test ID')).toThrow('Test ID must be a valid UUID');
  });

  // Debería lanzar ValidationError para un UUID con longitud incorrecta
  it('should throw ValidationError for a UUID with wrong segment length', () => {
    expect(() =>
      assertValidUuid('123e4567-e89b-12d3-a456-42661417400', 'Test ID'),
    ).toThrow('Test ID must be a valid UUID');
  });

  // El mensaje de error debe reflejar el fieldName recibido
  it('should interpolate the given fieldName into the error message', () => {
    expect(() => assertValidUuid('', 'Stylist ID')).toThrow('Stylist ID is required');
    expect(() => assertValidUuid('bad', 'Stylist ID')).toThrow('Stylist ID must be a valid UUID');
  });
});
