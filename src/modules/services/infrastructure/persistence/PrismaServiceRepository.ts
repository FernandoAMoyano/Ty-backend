import { PrismaClient } from '@prisma/client';
import { Service } from '../../domain/entities/Service';
import { ServiceRepository } from '../../domain/repositories/ServiceRepository';

/**
 * Implementación de ServiceRepository usando Prisma ORM
 * Gestiona la persistencia de servicios en base de datos PostgreSQL con conversión de tipos
 */

/**
 * Busca un servicio por su ID único
 * @param id - ID único del servicio a buscar
 * @returns Promise que resuelve con el servicio encontrado o null si no existe
 */
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

  /**
   * Busca un servicio por su nombre (búsqueda insensible a mayúsculas)
   * @param name - Nombre del servicio a buscar
   * @returns Promise que resuelve con el servicio encontrado o null si no existe
   */
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

  /**
   * Obtiene todos los servicios del sistema ordenados alfabéticamente
   * @returns Promise que resuelve con un array de todos los servicios
   */
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

  /**
   * Obtiene solo los servicios activos ordenados alfabéticamente
   * @returns Promise que resuelve con un array de servicios activos
   */
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

  /**
   * Busca todos los servicios que pertenecen a una categoría específica
   * @param categoryId - ID único de la categoría
   * @returns Promise que resuelve con un array de servicios de la categoría
   */
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

  /**
   * Busca solo los servicios activos que pertenecen a una categoría específica
   * @param categoryId - ID único de la categoría
   * @returns Promise que resuelve con un array de servicios activos de la categoría
   */
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

  /**
   * Guarda un nuevo servicio en la base de datos
   * @param service - Entidad de servicio a guardar
   * @returns Promise que resuelve con el servicio guardado
   */
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

  /**
   * Actualiza un servicio existente en la base de datos
   * @param service - Entidad de servicio con los datos actualizados
   * @returns Promise que resuelve con el servicio actualizado
   */
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

  /**
   * Elimina un servicio de la base de datos de forma permanente
   * @param id - ID único del servicio a eliminar
   * @returns Promise que resuelve cuando la eliminación se completa
   */
  async delete(id: string): Promise<void> {
    await this.prisma.service.delete({
      where: { id },
    });
  }

  /**
   * Verifica si existe un servicio con el ID especificado
   * @param id - ID único del servicio a verificar
   * @returns Promise que resuelve con true si existe, false en caso contrario
   */
  async existsById(id: string): Promise<boolean> {
    const count = await this.prisma.service.count({
      where: { id },
    });
    return count > 0;
  }

  /**
   * Verifica si existe un servicio con el nombre especificado (insensible a mayúsculas)
   * @param name - Nombre del servicio a verificar
   * @returns Promise que resuelve con true si existe, false en caso contrario
   */
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
