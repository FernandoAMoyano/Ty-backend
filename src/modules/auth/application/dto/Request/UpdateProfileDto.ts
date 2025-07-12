/**
 * DTO para actualización parcial de perfil de usuario
 * Permite modificar datos del perfil sin afectar credenciales de acceso
 */
export interface UpdateProfileDto {
  /** Nuevo nombre del usuario (opcional) */
  name?: string;
  /** Nuevo número de teléfono (opcional) */
  phone?: string;
  /** Nueva URL de foto de perfil (opcional) */
  profilePicture?: string;
}
