/**
 * DTO para estadísticas generales de citas
 */
export interface AppointmentStatisticsDto {
  /** Número total de citas en el conjunto de datos analizado */
  totalAppointments: number;

  /** Desglose de citas agrupadas por estado (clave: nombre del estado, valor: cantidad) */
  statusBreakdown: Record<string, number>;

  /** Información del período de tiempo analizado (opcional) */
  period?: {
    /** Fecha de inicio del período en formato ISO string */
    startDate: string;
    /** Fecha de fin del período en formato ISO string */
    endDate: string;
  };

  /** Contexto del análisis estadístico (opcional) */
  context?: {
    /** Tipo de análisis: global, por estilista o por cliente */
    type: 'global' | 'stylist' | 'client';
    /** ID de la entidad analizada (stylist o client) cuando aplique */
    entityId?: string;
    /** Nombre de la entidad analizada para mejor legibilidad */
    entityName?: string;
  };
}

/**
 * DTO para resumen estadístico de citas con métricas calculadas
 */
export interface AppointmentStatisticsSummaryDto {
  /** Número de citas en estado pendiente */
  pending: number;

  /** Número de citas confirmadas */
  confirmed: number;

  /** Número de citas en progreso */
  inProgress: number;

  /** Número de citas completadas exitosamente */
  completed: number;

  /** Número de citas canceladas */
  cancelled: number;

  /** Número de citas donde el cliente no se presentó */
  noShow: number;

  /** Número total de citas (suma de todos los estados) */
  total: number;

  /**
   * Tasa de finalización exitosa como porcentaje
   * Calculada como: (completadas / (completadas + canceladas + no_show)) * 100
   */
  completionRate: number;

  /**
   * Tasa de asistencia como porcentaje
   * Calculada como: ((completadas + en_progreso) / (confirmadas + completadas + en_progreso + no_show)) * 100
   */
  showRate: number;
}
