/**
 * Interfaz para servicios de hashing de contraseñas
 * Define operaciones de cifrado y comparación de passwords
 */
export interface HashService {
  /**
   * Genera un hash seguro de un texto plano
   * @param plainText - Texto plano a hashear (generalmente una contraseña)
   * @returns Promise con el hash generado
   */
  hash(plainText: string): Promise<string>;
  /**
   * Compara un texto plano con un hash almacenado
   * @param plainText - Texto plano a verificar
   * @param hashedText - Hash almacenado para comparar
   * @returns Promise<boolean> true si coinciden, false si no
   */
  compare(plainText: string, hashedText: string): Promise<boolean>;
}
