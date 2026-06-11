import { RoleName } from '@prisma/client';
import { Role } from '../entities/Role';

/**
 * Interfaz del repositorio para operaciones de persistencia de roles
 * Define el contrato para acceso a datos de roles del sistema
 */
export interface IRoleRepository {
  findById(id: string): Promise<Role | null>;
  findByName(name: RoleName): Promise<Role | null>;
  findAll(): Promise<Role[]>;
  save(role: Role): Promise<Role>;
  update(role: Role): Promise<Role>;
  delete(id: string): Promise<void>;
}
