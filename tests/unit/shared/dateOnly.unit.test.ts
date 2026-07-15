import {
  parseDateOnlyUTC,
  startOfDayUTC,
  endOfDayUTC,
  yearRangeUTC,
  monthRangeUTC,
} from '../../../src/shared/utils/dateOnly';
import { ValidationError } from '../../../src/shared/exceptions/ValidationError';

describe('dateOnly Utils Unit Tests (F7)', () => {
  describe('parseDateOnlyUTC', () => {
    // Debería parsear un string YYYY-MM-DD como medianoche UTC
    it('should parse a YYYY-MM-DD string as UTC midnight', () => {
      const date = parseDateOnlyUTC('2026-01-01');

      expect(date.getUTCFullYear()).toBe(2026);
      expect(date.getUTCMonth()).toBe(0);
      expect(date.getUTCDate()).toBe(1);
      expect(date.getUTCHours()).toBe(0);
      expect(date.getUTCMinutes()).toBe(0);
      expect(date.getUTCSeconds()).toBe(0);
      expect(date.getUTCMilliseconds()).toBe(0);
    });

    // El feriado del 1 de enero debe parsearse en el día correcto sin importar el offset local
    it('should keep December 31st and January 1st distinguishable at UTC boundaries', () => {
      const dec31 = parseDateOnlyUTC('2025-12-31');
      const jan1 = parseDateOnlyUTC('2026-01-01');

      expect(dec31.getUTCDate()).toBe(31);
      expect(dec31.getUTCMonth()).toBe(11);
      expect(jan1.getUTCDate()).toBe(1);
      expect(jan1.getUTCMonth()).toBe(0);
      expect(jan1.getTime()).toBeGreaterThan(dec31.getTime());
    });

    // Debería lanzar ValidationError para formatos inválidos
    it('should throw ValidationError for invalid formats', () => {
      const invalidInputs = [
        '',
        '2026-1-1',
        '2026/01/01',
        '01-01-2026',
        '2026-01-01T00:00:00.000Z',
        'not-a-date',
      ];

      invalidInputs.forEach((input) => {
        expect(() => parseDateOnlyUTC(input)).toThrow(ValidationError);
      });
    });

    // El helper solo valida formato (YYYY-MM-DD), no corrección de calendario: una fecha
    // inexistente como "30 de febrero" hace roll-over nativo de Date (igual que el
    // comportamiento previo del código, no es una regresión de F7)
    it('should roll over a syntactically valid but nonexistent date instead of throwing', () => {
      const rolledOver = parseDateOnlyUTC('2026-02-30');

      expect(rolledOver.getUTCFullYear()).toBe(2026);
      expect(rolledOver.getUTCMonth()).toBe(2); // Marzo (0-indexed)
      expect(rolledOver.getUTCDate()).toBe(2);
    });
  });

  describe('startOfDayUTC', () => {
    // Debería normalizar al inicio del día en UTC sin mutar el original
    it('should normalize to 00:00:00.000 UTC without mutating the input', () => {
      const original = new Date('2026-06-15T14:30:45.123Z');
      const result = startOfDayUTC(original);

      expect(result.getUTCHours()).toBe(0);
      expect(result.getUTCMinutes()).toBe(0);
      expect(result.getUTCSeconds()).toBe(0);
      expect(result.getUTCMilliseconds()).toBe(0);
      expect(result.getUTCDate()).toBe(15);
      expect(original.getUTCHours()).toBe(14);
    });
  });

  describe('endOfDayUTC', () => {
    // Debería normalizar al final del día en UTC sin mutar el original
    it('should normalize to 23:59:59.999 UTC without mutating the input', () => {
      const original = new Date('2026-06-15T14:30:45.123Z');
      const result = endOfDayUTC(original);

      expect(result.getUTCHours()).toBe(23);
      expect(result.getUTCMinutes()).toBe(59);
      expect(result.getUTCSeconds()).toBe(59);
      expect(result.getUTCMilliseconds()).toBe(999);
      expect(result.getUTCDate()).toBe(15);
      expect(original.getUTCHours()).toBe(14);
    });
  });

  describe('yearRangeUTC', () => {
    // El feriado del 1 de enero debe incluirse en el filtro por año
    it('should include January 1st holiday in year filter', () => {
      const { gte, lte } = yearRangeUTC(2026);
      const jan1 = parseDateOnlyUTC('2026-01-01');

      expect(jan1.getTime()).toBeGreaterThanOrEqual(gte.getTime());
      expect(jan1.getTime()).toBeLessThanOrEqual(lte.getTime());
    });

    // Debería incluir el 31 de diciembre y excluir el 1 de enero del año siguiente
    it('should include December 31st and exclude next year January 1st', () => {
      const { gte, lte } = yearRangeUTC(2026);
      const dec31 = parseDateOnlyUTC('2026-12-31');
      const nextJan1 = parseDateOnlyUTC('2027-01-01');

      expect(dec31.getTime()).toBeLessThanOrEqual(lte.getTime());
      expect(nextJan1.getTime()).toBeGreaterThan(lte.getTime());
      expect(gte.getUTCFullYear()).toBe(2026);
      expect(gte.getUTCMonth()).toBe(0);
      expect(gte.getUTCDate()).toBe(1);
    });
  });

  describe('monthRangeUTC', () => {
    // Debería calcular correctamente el rango de un mes de 31 días
    it('should calculate the correct range for a 31-day month', () => {
      const { gte, lte } = monthRangeUTC(2026, 1);

      expect(gte.getUTCDate()).toBe(1);
      expect(gte.getUTCMonth()).toBe(0);
      expect(lte.getUTCDate()).toBe(31);
      expect(lte.getUTCMonth()).toBe(0);
      expect(lte.getUTCHours()).toBe(23);
      expect(lte.getUTCMinutes()).toBe(59);
    });

    // Debería calcular correctamente el rango de febrero en año bisiesto
    it('should calculate the correct range for February in a leap year', () => {
      const { gte, lte } = monthRangeUTC(2028, 2);

      expect(gte.getUTCDate()).toBe(1);
      expect(lte.getUTCDate()).toBe(29);
      expect(lte.getUTCMonth()).toBe(1);
    });

    // Debería calcular correctamente el rango de diciembre (cruce de año)
    it('should calculate the correct range for December', () => {
      const { gte, lte } = monthRangeUTC(2026, 12);

      expect(gte.getUTCFullYear()).toBe(2026);
      expect(gte.getUTCMonth()).toBe(11);
      expect(gte.getUTCDate()).toBe(1);
      expect(lte.getUTCFullYear()).toBe(2026);
      expect(lte.getUTCMonth()).toBe(11);
      expect(lte.getUTCDate()).toBe(31);
    });
  });
});
