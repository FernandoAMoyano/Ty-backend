import { Stylist } from '../entities/Stylist';

export interface StylistRepository {
  findById(id: string): Promise<Stylist | null>;
  findByUserId(userId: string): Promise<Stylist | null>;
  findAll(): Promise<Stylist[]>;
  save(stylist: Stylist): Promise<Stylist>;
  update(stylist: Stylist): Promise<Stylist>;
  delete(id: string): Promise<void>;
  existsById(id: string): Promise<boolean>;
}
