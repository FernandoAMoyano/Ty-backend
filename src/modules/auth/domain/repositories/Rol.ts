import { Role, SystemRoles } from '../entities/Role';

export interface RoleRepository {
  findById(id: string): Promise<Role | null>;
  findByName(name: SystemRoles): Promise<Role | null>;
  findAll(): Promise<Role[]>;
  save(role: Role): Promise<Role>;
  update(role: Role): Promise<Role>;
  delete(id: string): Promise<void>;
}
