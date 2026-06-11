import { Stylist } from '../entities/Stylist';

/**
 * Interfaz del repositorio para la gestión de persistencia de estilistas
 */
export interface IStylistRepository {
  findById(id: string): Promise<Stylist | null>;
  findByUserId(userId: string): Promise<Stylist | null>;
  findAll(): Promise<Stylist[]>;
  save(stylist: Stylist): Promise<Stylist>;
  update(stylist: Stylist): Promise<Stylist>;
  delete(id: string): Promise<void>;
  existsById(id: string): Promise<boolean>;
}
