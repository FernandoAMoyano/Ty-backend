import { User } from '../entities/User';

export interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findByEmailWithRole(email: string): Promise<any | null>;
  existsByEmail(email: string): Promise<boolean>;
  save(user: User): Promise<User>;
  update(user: User): Promise<User>;
  delete(id: string): Promise<void>;
  findAll(): Promise<User[]>;
  findByRole(roleId: string): Promise<User[]>;
}
