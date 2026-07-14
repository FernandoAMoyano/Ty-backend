import { AppointmentDto } from './AppointmentDto';

/**
 * DTO de respuesta paginada para citas
 * @description Estructura de datos para respuestas de listado con paginación
 * (mismo shape que PaginatedPaymentsResponseDto / NotificationListDto, F17)
 */
export interface PaginatedAppointmentsResponseDto {
  /**
   * Lista de citas de la página actual
   */
  appointments: AppointmentDto[];

  /**
   * Total de registros que coinciden con el filtro (ya aplicado el ownership)
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
