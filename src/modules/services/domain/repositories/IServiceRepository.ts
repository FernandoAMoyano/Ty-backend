import { Service } from '../entities/Service';

/**
 * Interfaz del repositorio para la gestión de persistencia de servicios
 */
export interface IServiceRepository {
  findById(id: string): Promise<Service | null>;
  findByName(name: string): Promise<Service | null>;
  findAll(): Promise<Service[]>;
  findActive(): Promise<Service[]>;
  findByCategory(categoryId: string): Promise<Service[]>;
  findActiveByCategoryId(categoryId: string): Promise<Service[]>;
  save(service: Service): Promise<Service>;
  update(service: Service): Promise<Service>;
  delete(id: string): Promise<void>;
  existsById(id: string): Promise<boolean>;
  existsByName(name: string): Promise<boolean>;
}
