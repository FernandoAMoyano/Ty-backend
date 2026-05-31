/**
 * DTO para datos de autenticación de usuario
 * Contiene las credenciales necesarias para el proceso de login
 */
export interface LoginDto {
  /** Dirección de correo electrónico del usuario */
  email: string;
  /** Contraseña en texto plano del usuario */
  password: string;
}
