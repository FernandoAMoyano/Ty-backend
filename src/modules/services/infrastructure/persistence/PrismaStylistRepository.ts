import { PrismaClient } from '@prisma/client';
import { StylistRepository } from '../../domain/repositories/StylistRepository';
import { Stylist } from '../../domain/entities/Stylist';

/**
 * Implementación de StylistRepository usando Prisma ORM
 * Gestiona la persistencia de estilistas en base de datos PostgreSQL con relaciones a usuarios
 */

/**
 * Busca un estilista por su ID único incluyendo información del usuario relacionado
 * @param id - ID único del estilista a buscar
 * @returns Promise que resuelve con el estilista encontrado o null si no existe
 */
export class PrismaStylistRepository implements StylistRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string): Promise<Stylist | null> {
    const stylistData = await this.prisma.stylist.findUnique({
      where: { id },
      include: {
        user: true,
      },
    });

    if (!stylistData) return null;

    return Stylist.fromPersistence(
      stylistData.id,
      stylistData.userId,
      stylistData.createdAt,
      stylistData.updatedAt,
    );
  }

  /**
   * Busca un estilista por el ID del usuario asociado incluyendo información del usuario
   * @param userId - ID único del usuario que es estilista
   * @returns Promise que resuelve con el estilista encontrado o null si no existe
   */
  async findByUserId(userId: string): Promise<Stylist | null> {
    const stylistData = await this.prisma.stylist.findUnique({
      where: { userId },
      include: {
        user: true,
      },
    });

    if (!stylistData) return null;

    return Stylist.fromPersistence(
      stylistData.id,
      stylistData.userId,
      stylistData.createdAt,
      stylistData.updatedAt,
    );
  }

  /**
   * Obtiene todos los estilistas del sistema incluyendo información de usuarios relacionados
   * Ordenados por fecha de creación (más recientes primero)
   * @returns Promise que resuelve con un array de todos los estilistas
   */
  async findAll(): Promise<Stylist[]> {
    const stylistsData = await this.prisma.stylist.findMany({
      include: {
        user: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return stylistsData.map((data) =>
      Stylist.fromPersistence(data.id, data.userId, data.createdAt, data.updatedAt),
    );
  }

  /**
   * Guarda un nuevo estilista en la base de datos
   * @param stylist - Entidad de estilista a guardar
   * @returns Promise que resuelve con el estilista guardado
   */
  async save(stylist: Stylist): Promise<Stylist> {
    const stylistData = await this.prisma.stylist.create({
      data: {
        id: stylist.id,
        userId: stylist.userId,
        createdAt: stylist.createdAt,
        updatedAt: stylist.updatedAt,
      },
    });

    return Stylist.fromPersistence(
      stylistData.id,
      stylistData.userId,
      stylistData.createdAt,
      stylistData.updatedAt,
    );
  }

  /**
   * Actualiza un estilista existente en la base de datos
   * @param stylist - Entidad de estilista con los datos actualizados
   * @returns Promise que resuelve con el estilista actualizado
   */
  async update(stylist: Stylist): Promise<Stylist> {
    const stylistData = await this.prisma.stylist.update({
      where: { id: stylist.id },
      data: {
        userId: stylist.userId,
        updatedAt: stylist.updatedAt,
      },
    });

    return Stylist.fromPersistence(
      stylistData.id,
      stylistData.userId,
      stylistData.createdAt,
      stylistData.updatedAt,
    );
  }

  /**
   * Elimina un estilista de la base de datos de forma permanente
   * @param id - ID único del estilista a eliminar
   * @returns Promise que resuelve cuando la eliminación se completa
   */
  async delete(id: string): Promise<void> {
    await this.prisma.stylist.delete({
      where: { id },
    });
  }

  /**
   * Verifica si existe un estilista con el ID especificado
   * @param id - ID único del estilista a verificar
   * @returns Promise que resuelve con true si existe, false en caso contrario
   */
  async existsById(id: string): Promise<boolean> {
    const count = await this.prisma.stylist.count({
      where: { id },
    });
    return count > 0;
  }
}
