import { PrismaClient } from '@prisma/client';
import { Client } from '../../domain/entities/Client';
import { ClientRepository } from '../../domain/repositories/Client';

/**
 * Implementación de ClientRepository usando Prisma ORM
 * Proporciona persistencia de datos de clientes en base de datos relacional
 */
export class PrismaClientRepository implements ClientRepository {
  /**
   * Constructor que inyecta el cliente Prisma
   * @param prisma - Cliente Prisma para acceso a base de datos
   */
  constructor(private prisma: PrismaClient) {}

  /**
   * Busca un cliente por su ID único en la base de datos
   * @param id - ID único del cliente
   * @returns Promise que resuelve con el cliente encontrado o null si no existe
   */
  async findById(id: string): Promise<Client | null> {
    const clientData = await this.prisma.client.findUnique({
      where: { id },
    });

    if (!clientData) return null;

    return Client.fromPersistence(
      clientData.id,
      clientData.userId,
      clientData.preferences,
      clientData.createdAt,
      clientData.updatedAt,
    );
  }

  /**
   * Busca un cliente por el ID del usuario asociado
   * @param userId - ID único del usuario
   * @returns Promise que resuelve con el cliente encontrado o null si no existe
   */
  async findByUserId(userId: string): Promise<Client | null> {
    const clientData = await this.prisma.client.findUnique({
      where: { userId },
    });

    if (!clientData) return null;

    return Client.fromPersistence(
      clientData.id,
      clientData.userId,
      clientData.preferences,
      clientData.createdAt,
      clientData.updatedAt,
    );
  }

  /**
   * Obtiene todos los clientes del sistema
   * @returns Promise que resuelve con un array de todos los clientes
   */
  async findAll(): Promise<Client[]> {
    const clientsData = await this.prisma.client.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return clientsData.map((clientData) =>
      Client.fromPersistence(
        clientData.id,
        clientData.userId,
        clientData.preferences,
        clientData.createdAt,
        clientData.updatedAt,
      ),
    );
  }

  /**
   * Guarda un nuevo cliente en el sistema
   * @param client - Entidad de cliente a guardar
   * @returns Promise que resuelve con el cliente guardado
   */
  async save(client: Client): Promise<Client> {
    const clientData = await this.prisma.client.create({
      data: {
        id: client.id,
        userId: client.userId,
        preferences: client.preferences,
        createdAt: client.createdAt,
        updatedAt: client.updatedAt,
      },
    });

    return Client.fromPersistence(
      clientData.id,
      clientData.userId,
      clientData.preferences,
      clientData.createdAt,
      clientData.updatedAt,
    );
  }

  /**
   * Actualiza un cliente existente en el sistema
   * @param client - Entidad de cliente con los datos actualizados
   * @returns Promise que resuelve con el cliente actualizado
   */
  async update(client: Client): Promise<Client> {
    const clientData = await this.prisma.client.update({
      where: { id: client.id },
      data: {
        preferences: client.preferences,
        updatedAt: client.updatedAt,
      },
    });

    return Client.fromPersistence(
      clientData.id,
      clientData.userId,
      clientData.preferences,
      clientData.createdAt,
      clientData.updatedAt,
    );
  }

  /**
   * Elimina un cliente del sistema
   * @param id - ID único del cliente a eliminar
   */
  async delete(id: string): Promise<void> {
    await this.prisma.client.delete({
      where: { id },
    });
  }

  /**
   * Verifica si existe un cliente con el ID especificado
   * @param id - ID único del cliente a verificar
   * @returns Promise que resuelve con true si existe, false en caso contrario
   */
  async existsById(id: string): Promise<boolean> {
    const count = await this.prisma.client.count({
      where: { id },
    });
    return count > 0;
  }

  /**
   * Verifica si existe un cliente asociado al usuario especificado
   * @param userId - ID único del usuario a verificar
   * @returns Promise que resuelve con true si existe, false en caso contrario
   */
  async existsByUserId(userId: string): Promise<boolean> {
    const count = await this.prisma.client.count({
      where: { userId },
    });
    return count > 0;
  }
}
