/**
 * DTO de respuesta para la desactivación de un usuario
 * Incluye resumen de las acciones en cascada realizadas
 */
export interface DeactivateUserResponseDto {
  /** ID del usuario desactivado */
  userId: string;
  /** Email del usuario desactivado */
  email: string;
  /** Nombre del usuario desactivado */
  name: string;
  /** Indica si se ejecutaron acciones en cascada (solo STYLIST) */
  cascadeApplied: boolean;
  /** Resumen de las acciones en cascada ejecutadas */
  cascadeSummary?: {
    /** Cantidad de citas canceladas automáticamente */
    appointmentsCancelled: number;
    /** Cantidad de asignaciones StylistService desactivadas */
    servicesDeactivated: number;
  };
}
