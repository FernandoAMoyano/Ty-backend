import { ValidationError } from '../exceptions/ValidationError';

/**
 * Helpers puros para el manejo de fechas-sin-hora (calendario) en UTC.
 * @description Convención del proyecto: todo campo "fecha sin hora" (feriados, excepciones de
 * horario, disponibilidad) se interpreta y opera en UTC, sin importar la zona horaria del
 * proceso que ejecuta el código. Esto evita bugs de límite de día cuando el servidor no corre
 * en UTC (ver F7 en el plan de acción).
 */

const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Parsea un string `YYYY-MM-DD` como medianoche UTC de ese día.
 * @param dateString - Fecha en formato YYYY-MM-DD
 * @throws ValidationError si el formato o la fecha son inválidos
 */
export function parseDateOnlyUTC(dateString: string): Date {
  if (!dateString || !DATE_ONLY_REGEX.test(dateString)) {
    throw new ValidationError('Date must be in YYYY-MM-DD format');
  }

  const date = new Date(`${dateString}T00:00:00.000Z`);

  if (isNaN(date.getTime())) {
    throw new ValidationError('Invalid date provided');
  }

  return date;
}

/**
 * Devuelve una copia de la fecha normalizada al inicio del día en UTC (00:00:00.000).
 * @param date - Fecha base
 */
export function startOfDayUTC(date: Date): Date {
  const result = new Date(date);
  result.setUTCHours(0, 0, 0, 0);
  return result;
}

/**
 * Devuelve una copia de la fecha normalizada al final del día en UTC (23:59:59.999).
 * @param date - Fecha base
 */
export function endOfDayUTC(date: Date): Date {
  const result = new Date(date);
  result.setUTCHours(23, 59, 59, 999);
  return result;
}

/**
 * Calcula el rango [inicio, fin] de un año completo en UTC.
 * @param year - Año a calcular (p.ej. 2026)
 */
export function yearRangeUTC(year: number): { gte: Date; lte: Date } {
  return {
    gte: new Date(Date.UTC(year, 0, 1)),
    lte: new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999)),
  };
}

/**
 * Calcula el rango [inicio, fin] de un mes completo en UTC.
 * @param year - Año (p.ej. 2026)
 * @param month - Mes 1-12
 */
export function monthRangeUTC(year: number, month: number): { gte: Date; lte: Date } {
  return {
    gte: new Date(Date.UTC(year, month - 1, 1)),
    lte: new Date(Date.UTC(year, month, 0, 23, 59, 59, 999)),
  };
}
