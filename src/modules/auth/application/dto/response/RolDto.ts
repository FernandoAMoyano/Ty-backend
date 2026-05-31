/**
 * DTO para datos de rol de usuario
 * Contiene información básica del rol asignado al usuario
 */
export interface RoleDto {
  /** ID único del rol */
  id: string;
  /** Nombre del rol (CLIENT, STYLIST, ADMIN) */
  name: string;
  /** Descripción del rol y sus permisos (opcional) */
  description?: string;
}
