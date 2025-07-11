import { PrismaClient } from '@prisma/client';
import { Category } from '../../domain/entities/Category';
import { CategoryRepository } from '../../domain/repositories/CategoryRepository';

/**
 * Implementación de CategoryRepository usando Prisma ORM
 * Gestiona la persistencia de categorías en base de datos PostgreSQL
 */

/**
 * Busca una categoría por su ID único
 * @param id - ID único de la categoría a buscar
 * @returns Promise que resuelve con la categoría encontrada o null si no existe
 */
export class PrismaCategoryRepository implements CategoryRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string): Promise<Category | null> {
    const categoryData = await this.prisma.category.findUnique({
      where: { id },
    });

    if (!categoryData) return null;

    return Category.fromPersistence(
      categoryData.id,
      categoryData.name,
      categoryData.description || undefined,
      categoryData.isActive,
      categoryData.createdAt,
      categoryData.updatedAt,
    );
  }

  /**
   * Busca una categoría por su nombre (búsqueda insensible a mayúsculas)
   * @param name - Nombre de la categoría a buscar
   * @returns Promise que resuelve con la categoría encontrada o null si no existe
   */
  async findByName(name: string): Promise<Category | null> {
    const categoryData = await this.prisma.category.findFirst({
      where: {
        name: {
          equals: name,
          mode: 'insensitive',
        },
      },
    });

    if (!categoryData) return null;

    return Category.fromPersistence(
      categoryData.id,
      categoryData.name,
      categoryData.description || undefined,
      categoryData.isActive,
      categoryData.createdAt,
      categoryData.updatedAt,
    );
  }

  /**
   * Obtiene todas las categorías del sistema ordenadas alfabéticamente
   * @returns Promise que resuelve con un array de todas las categorías
   */
  async findAll(): Promise<Category[]> {
    const categoriesData = await this.prisma.category.findMany({
      orderBy: { name: 'asc' },
    });

    return categoriesData.map((data) =>
      Category.fromPersistence(
        data.id,
        data.name,
        data.description || undefined,
        data.isActive,
        data.createdAt,
        data.updatedAt,
      ),
    );
  }

  /**
   * Obtiene solo las categorías activas ordenadas alfabéticamente
   * @returns Promise que resuelve con un array de categorías activas
   */
  async findActive(): Promise<Category[]> {
    const categoriesData = await this.prisma.category.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });

    return categoriesData.map((data) =>
      Category.fromPersistence(
        data.id,
        data.name,
        data.description || undefined,
        data.isActive,
        data.createdAt,
        data.updatedAt,
      ),
    );
  }

  /**
   * Guarda una nueva categoría en la base de datos
   * @param category - Entidad de categoría a guardar
   * @returns Promise que resuelve con la categoría guardada
   */
  async save(category: Category): Promise<Category> {
    const categoryData = await this.prisma.category.create({
      data: {
        id: category.id,
        name: category.name,
        description: category.description,
        isActive: category.isActive,
        createdAt: category.createdAt,
        updatedAt: category.updatedAt,
      },
    });

    return Category.fromPersistence(
      categoryData.id,
      categoryData.name,
      categoryData.description || undefined,
      categoryData.isActive,
      categoryData.createdAt,
      categoryData.updatedAt,
    );
  }

  /**
   * Actualiza una categoría existente en la base de datos
   * @param category - Entidad de categoría con los datos actualizados
   * @returns Promise que resuelve con la categoría actualizada
   */
  async update(category: Category): Promise<Category> {
    const categoryData = await this.prisma.category.update({
      where: { id: category.id },
      data: {
        name: category.name,
        description: category.description,
        isActive: category.isActive,
        updatedAt: category.updatedAt,
      },
    });

    return Category.fromPersistence(
      categoryData.id,
      categoryData.name,
      categoryData.description || undefined,
      categoryData.isActive,
      categoryData.createdAt,
      categoryData.updatedAt,
    );
  }

  /**
   * Elimina una categoría de la base de datos de forma permanente
   * @param id - ID único de la categoría a eliminar
   * @returns Promise que resuelve cuando la eliminación se completa
   */
  async delete(id: string): Promise<void> {
    await this.prisma.category.delete({
      where: { id },
    });
  }

  /**
   * Verifica si existe una categoría con el ID especificado
   * @param id - ID único de la categoría a verificar
   * @returns Promise que resuelve con true si existe, false en caso contrario
   */
  async existsById(id: string): Promise<boolean> {
    const count = await this.prisma.category.count({
      where: { id },
    });
    return count > 0;
  }

  /**
   * Verifica si existe una categoría con el nombre especificado (insensible a mayúsculas)
   * @param name - Nombre de la categoría a verificar
   * @returns Promise que resuelve con true si existe, false en caso contrario
   */
  async existsByName(name: string): Promise<boolean> {
    const count = await this.prisma.category.count({
      where: {
        name: {
          equals: name,
          mode: 'insensitive',
        },
      },
    });
    return count > 0;
  }
}
