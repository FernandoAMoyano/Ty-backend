import * as bcrypt from 'bcrypt';
import { HashService } from '../../application/services/HashService';

/**
 * Implementación del servicio de hashing usando bcrypt
 * Proporciona funcionalidades seguras de cifrado de contraseñas con salt
 */
export class BcryptHashService implements HashService {
  /** Número de rondas de salt para bcrypt (mayor = más seguro pero más lento) */
  private readonly saltRounds = 12;

  /**
   * Genera un hash seguro de un texto plano usando bcrypt
   * @param plainText - Texto plano a hashear (generalmente una contraseña)
   * @returns Promise con el hash generado incluyendo salt
   * @description Usa bcrypt con 12 rondas de salt para máxima seguridad
   */
  async hash(plainText: string): Promise<string> {
    return bcrypt.hash(plainText, this.saltRounds);
  }

  /**
   * Compara un texto plano con un hash bcrypt almacenado
   * @param plainText - Texto plano a verificar
   * @param hashedText - Hash bcrypt almacenado para comparar
   * @returns Promise<boolean> true si coinciden, false si no
   * @description Utiliza la función compare de bcrypt que maneja el salt automáticamente
   */
  async compare(plainText: string, hashedText: string): Promise<boolean> {
    return bcrypt.compare(plainText, hashedText);
  }
}
