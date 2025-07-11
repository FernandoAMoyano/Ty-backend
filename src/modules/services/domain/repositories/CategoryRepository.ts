import { Category } from '../entities/Category';

/**
 * Interfaz del repositorio para la gestión de persistencia de categorías
 * Define todos los métodos necesarios para operaciones CRUD y consultas específicas de categorías
 */
export interface CategoryRepository {
  /**
   * Busca una categoría por su ID único
   * @param id - ID único de la categoría a buscar
   * @returns Promise que resuelve con la categoría encontrada o null si no existe
   */
  findById(id: string): Promise<Category | null>;

  /**
   * Busca una categoría por su nombre
   * @param name - Nombre de la categoría a buscar
   * @returns Promise que resuelve con la categoría encontrada o null si no existe
   */
  findByName(name: string): Promise<Category | null>;

  /**
   * Obtiene todas las categorías del sistema (activas e inactivas)
   * @returns Promise que resuelve con un array de todas las categorías
   */
  findAll(): Promise<Category[]>;

  /**
   * Obtiene solo las categorías que están activas
   * @returns Promise que resuelve con un array de categorías activas
   */
  findActive(): Promise<Category[]>;

  /**
   * Guarda una nueva categoría en el sistema
   * @param category - Entidad de categoría a guardar
   * @returns Promise que resuelve con la categoría guardada (con ID asignado)
   */
  save(category: Category): Promise<Category>;

  /**
   * Actualiza una categoría existente en el sistema
   * @param category - Entidad de categoría con los datos actualizados
   * @returns Promise que resuelve con la categoría actualizada
   */
  update(category: Category): Promise<Category>;

  /**
   * Elimina una categoría del sistema de forma permanente
   * @param id - ID único de la categoría a eliminar
   * @returns Promise que resuelve cuando la eliminación se completa
   */
  delete(id: string): Promise<void>;

  /**
   * Verifica si existe una categoría con el ID especificado
   * @param id - ID único de la categoría a verificar
   * @returns Promise que resuelve con true si existe, false en caso contrario
   */
  existsById(id: string): Promise<boolean>;

  /**
   * Verifica si existe una categoría con el nombre especificado
   * @param name - Nombre de la categoría a verificar
   * @returns Promise que resuelve con true si existe, false en caso contrario
   */
  existsByName(name: string): Promise<boolean>;
}
