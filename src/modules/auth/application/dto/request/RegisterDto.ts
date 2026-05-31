/**
 * DTO para datos de registro de nuevo usuario
 * Contiene toda la información necesaria para crear una cuenta de usuario
 */
export interface RegisterDto {
  /** Nombre completo del usuario */
  name: string;
  /** Dirección de correo electrónico única del usuario */
  email: string;
  /** Número de teléfono del usuario */
  phone: string;
  /** Contraseña en texto plano (se hasheará antes de almacenar) */
  password: string;
  /** Nombre del rol a asignar (opcional, por defecto CLIENT) */
  roleName?: string;
  /** URL de la foto de perfil del usuario (opcional) */
  profilePicture?: string;
}
