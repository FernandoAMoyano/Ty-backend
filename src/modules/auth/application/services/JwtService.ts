/**
 * Payload estándar para tokens JWT del sistema
 * Contiene información esencial del usuario autenticado
 */
export interface JwtPayload {
  /** ID único del usuario en el sistema */
  userId: string;
  /** ID del rol asignado al usuario */
  roleId: string;
  /** Email del usuario para identificación */
  email: string;
}

/**
 * Interfaz para servicios de gestión de tokens JWT
 * Define operaciones de generación y verificación de tokens de acceso y renovación
 */
export interface JwtService {
  /**
   * Genera un token de acceso con tiempo de vida corto
   * @param payload - Datos del usuario a incluir en el token
   * @returns Token JWT firmado para acceso a recursos protegidos
   */
  generateAccessToken(payload: JwtPayload): string;
  /**
   * Genera un token de renovación con tiempo de vida largo
   * @param payload - Datos del usuario a incluir en el token
   * @returns Token JWT firmado para renovar tokens de acceso
   */
  generateRefreshToken(payload: JwtPayload): string;
  /**
   * Verifica y decodifica un token de acceso
   * @param token - Token JWT a verificar
   * @returns Payload decodificado si el token es válido
   * @throws UnauthorizedError si el token es inválido o expirado
   */
  verifyAccessToken(token: string): JwtPayload;
  /**
   * Verifica y decodifica un token de renovación
   * @param token - Token JWT de renovación a verificar
   * @returns Payload decodificado si el token es válido
   * @throws UnauthorizedError si el token es inválido o expirado
   */
  verifyRefreshToken(token: string): JwtPayload;
}
