import { User } from '../entities/User';

/**
 * Interfaz del repositorio para operaciones de persistencia de usuarios
 * Define el contrato para acceso a datos de usuarios sin exponer detalles de implementación
 */
export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByIdWithRole(id: string): Promise<any | null>;
  findByEmail(email: string): Promise<User | null>;
  findByEmailWithRole(email: string): Promise<any | null>;
  existsByEmail(email: string): Promise<boolean>;
  save(user: User): Promise<User>;
  update(user: User): Promise<User>;
  delete(id: string): Promise<void>;
  findAll(): Promise<User[]>;
  findByRole(roleId: string): Promise<User[]>;
}
