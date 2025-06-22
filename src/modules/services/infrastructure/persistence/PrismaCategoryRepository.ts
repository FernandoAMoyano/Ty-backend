import { PrismaClient } from '@prisma/client';
import { Category } from '../../domain/entities/Category';
import { CategoryRepository } from '../../domain/repositories/CategoryRepository';

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

  async delete(id: string): Promise<void> {
    await this.prisma.category.delete({
      where: { id },
    });
  }

  async existsById(id: string): Promise<boolean> {
    const count = await this.prisma.category.count({
      where: { id },
    });
    return count > 0;
  }

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
