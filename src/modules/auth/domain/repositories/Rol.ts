import { RoleName } from '@prisma/client';
import { Role } from '../entities/Role';

export interface RoleRepository {
  findById(id: string): Promise<Role | null>;
  findByName(name: RoleName): Promise<Role | null>;
  findAll(): Promise<Role[]>;
  save(role: Role): Promise<Role>;
  update(role: Role): Promise<Role>;
  delete(id: string): Promise<void>;
}
