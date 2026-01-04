import { PrismaClient } from '@prisma/client';
import { NotificationStatus } from '../../domain/entities/NotificationStatus';
import { NotificationStatusRepository } from '../../domain/repositories/NotificationStatusRepository';

/**
 * Implementación del repositorio de estados de notificación usando Prisma
 * @description Maneja la persistencia de estados de notificación en PostgreSQL
 */
export class PrismaNotificationStatusRepository implements NotificationStatusRepository {
  constructor(private prisma: PrismaClient) {}

  /**
   * Busca un estado de notificación por su ID único
   * @param id - ID único del estado
   * @returns Promise con el estado encontrado o null si no existe
   */
  async findById(id: string): Promise<NotificationStatus | null> {
    const status = await this.prisma.notificationStatus.findUnique({
      where: { id },
    });

    if (!status) return null;

    return NotificationStatus.fromPersistence(
      status.id,
      status.name,
      status.description || undefined,
    );
  }

  /**
   * Busca un estado de notificación por su nombre
   * @param name - Nombre del estado
   * @returns Promise con el estado encontrado o null si no existe
   */
  async findByName(name: string): Promise<NotificationStatus | null> {
    const status = await this.prisma.notificationStatus.findFirst({
      where: { name },
    });

    if (!status) return null;

    return NotificationStatus.fromPersistence(
      status.id,
      status.name,
      status.description || undefined,
    );
  }

  /**
   * Obtiene todos los estados de notificación disponibles
   * @returns Promise con array de todos los estados
   */
  async findAll(): Promise<NotificationStatus[]> {
    const statuses = await this.prisma.notificationStatus.findMany({
      orderBy: { name: 'asc' },
    });

    return statuses.map(status =>
      NotificationStatus.fromPersistence(
        status.id,
        status.name,
        status.description || undefined,
      ),
    );
  }

  /**
   * Guarda un nuevo estado de notificación en la base de datos
   * @param status - Entidad de estado a guardar
   * @returns Promise con el estado guardado
   */
  async save(status: NotificationStatus): Promise<NotificationStatus> {
    const data = status.toPersistence();

    const savedStatus = await this.prisma.notificationStatus.create({
      data: {
        id: data.id,
        name: data.name,
        description: data.description,
      },
    });

    return NotificationStatus.fromPersistence(
      savedStatus.id,
      savedStatus.name,
      savedStatus.description || undefined,
    );
  }

  /**
   * Actualiza un estado de notificación existente
   * @param status - Entidad de estado con los datos actualizados
   * @returns Promise con el estado actualizado
   */
  async update(status: NotificationStatus): Promise<NotificationStatus> {
    const data = status.toPersistence();

    const updatedStatus = await this.prisma.notificationStatus.update({
      where: { id: data.id },
      data: {
        name: data.name,
        description: data.description,
      },
    });

    return NotificationStatus.fromPersistence(
      updatedStatus.id,
      updatedStatus.name,
      updatedStatus.description || undefined,
    );
  }

  /**
   * Elimina un estado de notificación por su ID
   * @param id - ID único del estado a eliminar
   * @returns Promise que resuelve cuando se completa la eliminación
   */
  async delete(id: string): Promise<void> {
    await this.prisma.notificationStatus.delete({
      where: { id },
    });
  }

  /**
   * Verifica si existe un estado de notificación con el ID especificado
   * @param id - ID único del estado
   * @returns Promise con true si existe, false en caso contrario
   */
  async existsById(id: string): Promise<boolean> {
    const count = await this.prisma.notificationStatus.count({
      where: { id },
    });
    return count > 0;
  }

  /**
   * Verifica si existe un estado de notificación con el nombre especificado
   * @param name - Nombre del estado
   * @returns Promise con true si existe, false en caso contrario
   */
  async existsByName(name: string): Promise<boolean> {
    const count = await this.prisma.notificationStatus.count({
      where: { name },
    });
    return count > 0;
  }
}
