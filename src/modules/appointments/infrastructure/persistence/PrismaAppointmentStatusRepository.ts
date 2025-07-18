import { PrismaClient } from '@prisma/client';
import { AppointmentStatus } from '../../domain/entities/AppointmentStatus';
import { AppointmentStatusRepository } from '../../domain/repositories/AppointmentStatusRepository';

/**
 * Implementación de AppointmentStatusRepository usando Prisma ORM
 * Proporciona persistencia de datos de estados de citas en base de datos relacional
 */
export class PrismaAppointmentStatusRepository implements AppointmentStatusRepository {
  /**
   * Constructor que inyecta el cliente Prisma
   * @param prisma - Cliente Prisma para acceso a base de datos
   */
  constructor(private prisma: PrismaClient) {}

  /**
   * Busca un estado por su ID único
   * @param id - ID único del estado
   * @returns Promise que resuelve con el estado encontrado o null si no existe
   */
  async findById(id: string): Promise<AppointmentStatus | null> {
    const statusData = await this.prisma.appointmentStatus.findUnique({
      where: { id },
    });

    if (!statusData) return null;

    return AppointmentStatus.fromPersistence(
      statusData.id,
      statusData.name,
      statusData.description || undefined,
    );
  }

  /**
   * Busca un estado por su nombre
   * @param name - Nombre del estado
   * @returns Promise que resuelve con el estado encontrado o null si no existe
   */
  async findByName(name: string): Promise<AppointmentStatus | null> {
    const statusData = await this.prisma.appointmentStatus.findFirst({
      where: { name },
    });

    if (!statusData) return null;

    return AppointmentStatus.fromPersistence(
      statusData.id,
      statusData.name,
      statusData.description || undefined,
    );
  }

  /**
   * Obtiene todos los estados disponibles
   * @returns Promise que resuelve con un array de todos los estados
   */
  async findAll(): Promise<AppointmentStatus[]> {
    const statusesData = await this.prisma.appointmentStatus.findMany({
      orderBy: { name: 'asc' },
    });

    return statusesData.map(statusData =>
      AppointmentStatus.fromPersistence(
        statusData.id,
        statusData.name,
        statusData.description || undefined,
      ),
    );
  }

  /**
   * Guarda un nuevo estado en el sistema
   * @param status - Entidad de estado a guardar
   * @returns Promise que resuelve con el estado guardado
   */
  async save(status: AppointmentStatus): Promise<AppointmentStatus> {
    const statusData = await this.prisma.appointmentStatus.create({
      data: {
        id: status.id,
        name: status.name,
        description: status.description,
      },
    });

    return AppointmentStatus.fromPersistence(
      statusData.id,
      statusData.name,
      statusData.description || undefined,
    );
  }

  /**
   * Actualiza un estado existente
   * @param status - Entidad de estado con datos actualizados
   * @returns Promise que resuelve con el estado actualizado
   */
  async update(status: AppointmentStatus): Promise<AppointmentStatus> {
    const statusData = await this.prisma.appointmentStatus.update({
      where: { id: status.id },
      data: {
        name: status.name,
        description: status.description,
      },
    });

    return AppointmentStatus.fromPersistence(
      statusData.id,
      statusData.name,
      statusData.description || undefined,
    );
  }

  /**
   * Elimina un estado del sistema
   * @param id - ID único del estado a eliminar
   */
  async delete(id: string): Promise<void> {
    await this.prisma.appointmentStatus.delete({
      where: { id },
    });
  }

  /**
   * Verifica si existe un estado con el ID especificado
   * @param id - ID único del estado a verificar
   * @returns Promise que resuelve con true si existe, false en caso contrario
   */
  async existsById(id: string): Promise<boolean> {
    const count = await this.prisma.appointmentStatus.count({
      where: { id },
    });
    return count > 0;
  }

  /**
   * Verifica si existe un estado con el nombre especificado
   * @param name - Nombre del estado a verificar
   * @returns Promise que resuelve con true si existe, false en caso contrario
   */
  async existsByName(name: string): Promise<boolean> {
    const count = await this.prisma.appointmentStatus.count({
      where: { name },
    });
    return count > 0;
  }

  /**
   * Busca todos los estados terminales (estados finales)
   * @returns Promise que resuelve con un array de estados terminales
   */
  async findTerminalStatuses(): Promise<AppointmentStatus[]> {
    const statusesData = await this.prisma.appointmentStatus.findMany({
      where: {
        name: {
          in: ['COMPLETED', 'CANCELLED', 'NO_SHOW', 'Completada', 'Cancelada'],
        },
      },
      orderBy: { name: 'asc' },
    });

    return statusesData.map(statusData =>
      AppointmentStatus.fromPersistence(
        statusData.id,
        statusData.name,
        statusData.description || undefined,
      ),
    );
  }

  /**
   * Busca todos los estados activos (no terminales)
   * @returns Promise que resuelve con un array de estados activos
   */
  async findActiveStatuses(): Promise<AppointmentStatus[]> {
    const statusesData = await this.prisma.appointmentStatus.findMany({
      where: {
        name: {
          in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'Pendiente', 'Confirmada'],
        },
      },
      orderBy: { name: 'asc' },
    });

    return statusesData.map(statusData =>
      AppointmentStatus.fromPersistence(
        statusData.id,
        statusData.name,
        statusData.description || undefined,
      ),
    );
  }
}
