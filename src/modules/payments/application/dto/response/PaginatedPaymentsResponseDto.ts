import { PaymentResponseDto } from './PaymentResponseDto';

/**
 * DTO de respuesta paginada para pagos
 * @description Estructura de datos para respuestas de listado con paginación
 */
export interface PaginatedPaymentsResponseDto {
  /**
   * Lista de pagos
   */
  payments: PaymentResponseDto[];

  /**
   * Total de registros que coinciden con los filtros
   */
  total: number;

  /**
   * Página actual
   */
  page: number;

  /**
   * Cantidad de elementos por página
   */
  limit: number;

  /**
   * Total de páginas disponibles
   */
  totalPages: number;

  /**
   * Indica si hay una página siguiente
   */
  hasNextPage: boolean;

  /**
   * Indica si hay una página anterior
   */
  hasPreviousPage: boolean;
}
