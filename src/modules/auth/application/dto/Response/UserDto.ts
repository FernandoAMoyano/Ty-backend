import { RoleDto } from '../Response/RolDto';

/**
 * DTO para datos completos de usuario en respuestas
 * Incluye toda la información del usuario excepto credenciales sensibles
 */
export interface UserDto {
  /** ID único del usuario */
  id: string;
  /** Nombre completo del usuario */
  name: string;
  /** Dirección de correo electrónico del usuario */
  email: string;
  /** Número de teléfono del usuario */
  phone: string;
  /** Estado de activación de la cuenta */
  isActive: boolean;
  /** URL de la foto de perfil del usuario (opcional) */
  profilePicture?: string;
  /** Información del rol asignado al usuario */
  role: RoleDto;
  /** Fecha de creación de la cuenta */
  createdAt: Date;
  /** Fecha de última actualización del perfil */
  updatedAt: Date;
}
