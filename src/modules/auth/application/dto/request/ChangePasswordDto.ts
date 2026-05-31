/**
 * DTO para cambio de contraseña de usuario autenticado
 * Requiere verificación de identidad con contraseña actual antes del cambio
 */
export interface ChangePasswordDto {
  /** Contraseña actual del usuario para verificación de identidad */
  currentPassword: string;
  /** Nueva contraseña que reemplazará la actual */
  newPassword: string;
}
