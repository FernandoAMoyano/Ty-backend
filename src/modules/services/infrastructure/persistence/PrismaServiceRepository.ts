import { PrismaClient } from '@prisma/client';
import { Service } from '../../domain/entities/Service';
import { ServiceRepository } from '../../domain/repositories/ServiceRepository';

export class PrismaServiceRepository implements ServiceRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string): Promise<Service | null> {
    const serviceData = await this.prisma.service.findUnique({
      where: { id },
    });

    if (!serviceData) return null;

    return Service.fromPersistence(
      serviceData.id,
      serviceData.categoryId,
      serviceData.name,
      serviceData.description,
      serviceData.duration,
      serviceData.durationVariation,
      Number(serviceData.price),
      serviceData.isActive,
      serviceData.createdAt,
      serviceData.updatedAt,
    );
  }

  async findByName(name: string): Promise<Service | null> {
    const serviceData = await this.prisma.service.findFirst({
      where: {
        name: {
          equals: name,
          mode: 'insensitive',
        },
      },
    });

    if (!serviceData) return null;

    return Service.fromPersistence(
      serviceData.id,
      serviceData.categoryId,
      serviceData.name,
      serviceData.description,
      serviceData.duration,
      serviceData.durationVariation,
      Number(serviceData.price),
      serviceData.isActive,
      serviceData.createdAt,
      serviceData.updatedAt,
    );
  }

  async findAll(): Promise<Service[]> {
    const servicesData = await this.prisma.service.findMany({
      orderBy: { name: 'asc' },
    });

    return servicesData.map((data) =>
      Service.fromPersistence(
        data.id,
        data.categoryId,
        data.name,
        data.description,
        data.duration,
        data.durationVariation,
        Number(data.price),
        data.isActive,
        data.createdAt,
        data.updatedAt,
      ),
    );
  }

  async findActive(): Promise<Service[]> {
    const servicesData = await this.prisma.service.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });

    return servicesData.map((data) =>
      Service.fromPersistence(
        data.id,
        data.categoryId,
        data.name,
        data.description,
        data.duration,
        data.durationVariation,
        Number(data.price),
        data.isActive,
        data.createdAt,
        data.updatedAt,
      ),
    );
  }

  async findByCategory(categoryId: string): Promise<Service[]> {
    const servicesData = await this.prisma.service.findMany({
      where: { categoryId },
      orderBy: { name: 'asc' },
    });

    return servicesData.map((data) =>
      Service.fromPersistence(
        data.id,
        data.categoryId,
        data.name,
        data.description,
        data.duration,
        data.durationVariation,
        Number(data.price),
        data.isActive,
        data.createdAt,
        data.updatedAt,
      ),
    );
  }

  async findActiveByCategoryId(categoryId: string): Promise<Service[]> {
    const servicesData = await this.prisma.service.findMany({
      where: {
        categoryId,
        isActive: true,
      },
      orderBy: { name: 'asc' },
    });

    return servicesData.map((data) =>
      Service.fromPersistence(
        data.id,
        data.categoryId,
        data.name,
        data.description,
        data.duration,
        data.durationVariation,
        Number(data.price),
        data.isActive,
        data.createdAt,
        data.updatedAt,
      ),
    );
  }

  async save(service: Service): Promise<Service> {
    const serviceData = await this.prisma.service.create({
      data: {
        id: service.id,
        categoryId: service.categoryId,
        name: service.name,
        description: service.description,
        duration: service.duration,
        durationVariation: service.durationVariation,
        price: service.price,
        isActive: service.isActive,
        createdAt: service.createdAt,
        updatedAt: service.updatedAt,
      },
    });

    return Service.fromPersistence(
      serviceData.id,
      serviceData.categoryId,
      serviceData.name,
      serviceData.description,
      serviceData.duration,
      serviceData.durationVariation,
      Number(serviceData.price),
      serviceData.isActive,
      serviceData.createdAt,
      serviceData.updatedAt,
    );
  }

  async update(service: Service): Promise<Service> {
    const serviceData = await this.prisma.service.update({
      where: { id: service.id },
      data: {
        categoryId: service.categoryId,
        name: service.name,
        description: service.description,
        duration: service.duration,
        durationVariation: service.durationVariation,
        price: service.price,
        isActive: service.isActive,
        updatedAt: service.updatedAt,
      },
    });

    return Service.fromPersistence(
      serviceData.id,
      serviceData.categoryId,
      serviceData.name,
      serviceData.description,
      serviceData.duration,
      serviceData.durationVariation,
      Number(serviceData.price),
      serviceData.isActive,
      serviceData.createdAt,
      serviceData.updatedAt,
    );
  }

  async delete(id: string): Promise<void> {
    await this.prisma.service.delete({
      where: { id },
    });
  }

  async existsById(id: string): Promise<boolean> {
    const count = await this.prisma.service.count({
      where: { id },
    });
    return count > 0;
  }

  async existsByName(name: string): Promise<boolean> {
    const count = await this.prisma.service.count({
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
