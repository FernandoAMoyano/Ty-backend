/**
 * DTO de respuesta para renovación de token
 * Contiene el token de renovación para generar nuevos tokens de acceso
 */
export interface RefreshTokenDto {
  /** Token de renovación JWT */
  refreshToken: string;
}
