import { Category } from '../entities/Category';

export interface CategoryRepository {
  findById(id: string): Promise<Category | null>;
  findByName(name: string): Promise<Category | null>;
  findAll(): Promise<Category[]>;
  findActive(): Promise<Category[]>;
  save(category: Category): Promise<Category>;
  update(category: Category): Promise<Category>;
  delete(id: string): Promise<void>;
  existsById(id: string): Promise<boolean>;
  existsByName(name: string): Promise<boolean>;
}
