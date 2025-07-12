import { UserDto } from './UserDto';

/**
 * DTO de respuesta para autenticación exitosa
 * Contiene tokens JWT y datos completos del usuario autenticado
 */
export interface LoginResponseDto {
  /** Token JWT de acceso para autorización de requests */
  token: string;
  /** Token de renovación para generar nuevos tokens de acceso */
  refreshToken: string;
  /** Datos completos del usuario autenticado incluyendo rol */
  user: UserDto;
}
