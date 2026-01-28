import { PaymentStatusEnum } from '../../../domain/entities/Payment';

/**
 * DTO para filtrar pagos en consultas
 * @description Contiene los filtros y opciones de paginación para listar pagos
 */
export interface PaymentFiltersDto {
  /**
   * Filtrar por estado del pago
   * @example 'COMPLETED'
   */
  status?: PaymentStatusEnum;

  /**
   * Filtrar por ID de cita
   */
  appointmentId?: string;

  /**
   * Fecha de inicio del rango de búsqueda
   * @example '2025-01-01'
   */
  startDate?: string;

  /**
   * Fecha de fin del rango de búsqueda
   * @example '2025-12-31'
   */
  endDate?: string;

  /**
   * Número de página para paginación
   * @default 1
   */
  page?: number;

  /**
   * Cantidad de elementos por página
   * @default 20
   */
  limit?: number;
}
