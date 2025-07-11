import { PrismaClient } from '@prisma/client';
import { StylistService } from '../../domain/entities/StylistService';
import { StylistServiceRepository } from '../../domain/repositories/StylistServiceRepository';

/**
 * Implementación de StylistServiceRepository usando Prisma ORM
 * Gestiona la persistencia de asignaciones estilista-servicio con clave compuesta y conversión de tipos
 */

/**
 * Busca una asignación específica entre un estilista y un servicio usando clave compuesta
 * @param stylistId - ID único del estilista
 * @param serviceId - ID único del servicio
 * @returns Promise que resuelve con la asignación encontrada o null si no existe
 */
export class PrismaStylistServiceRepository implements StylistServiceRepository {
  constructor(private prisma: PrismaClient) {}

  async findByStylistAndService(
    stylistId: string,
    serviceId: string,
  ): Promise<StylistService | null> {
    const stylistServiceData = await this.prisma.stylistService.findUnique({
      where: {
        stylistId_serviceId: {
          stylistId,
          serviceId,
        },
      },
    });

    if (!stylistServiceData) return null;

    return StylistService.fromPersistence(
      stylistServiceData.stylistId,
      stylistServiceData.serviceId,
      stylistServiceData.customPrice ? Number(stylistServiceData.customPrice) : undefined,
      stylistServiceData.isOffering ?? true,
      stylistServiceData.createdAt,
      stylistServiceData.updatedAt,
    );
  }

  /**
   * Busca todas las asignaciones de servicios para un estilista específico
   * Ordenadas por fecha de creación (más recientes primero)
   * @param stylistId - ID único del estilista
   * @returns Promise que resuelve con un array de asignaciones del estilista
   */
  async findByStylist(stylistId: string): Promise<StylistService[]> {
    const stylistServicesData = await this.prisma.stylistService.findMany({
      where: { stylistId },
      orderBy: { createdAt: 'desc' },
    });

    return stylistServicesData.map((data) =>
      StylistService.fromPersistence(
        data.stylistId,
        data.serviceId,
        data.customPrice ? Number(data.customPrice) : undefined,
        data.isOffering ?? true,
        data.createdAt,
        data.updatedAt,
      ),
    );
  }

  /**
   * Busca todas las asignaciones de estilistas para un servicio específico
   * Ordenadas por fecha de creación (más recientes primero)
   * @param serviceId - ID único del servicio
   * @returns Promise que resuelve con un array de asignaciones del servicio
   */
  async findByService(serviceId: string): Promise<StylistService[]> {
    const stylistServicesData = await this.prisma.stylistService.findMany({
      where: { serviceId },
      orderBy: { createdAt: 'desc' },
    });

    return stylistServicesData.map((data) =>
      StylistService.fromPersistence(
        data.stylistId,
        data.serviceId,
        data.customPrice ? Number(data.customPrice) : undefined,
        data.isOffering ?? true,
        data.createdAt,
        data.updatedAt,
      ),
    );
  }

  /**
   * Busca solo las asignaciones activas (que están siendo ofrecidas) de un estilista
   * @param stylistId - ID único del estilista
   * @returns Promise que resuelve con un array de asignaciones activas del estilista
   */
  async findActiveOfferings(stylistId: string): Promise<StylistService[]> {
    const stylistServicesData = await this.prisma.stylistService.findMany({
      where: {
        stylistId,
        isOffering: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return stylistServicesData.map((data) =>
      StylistService.fromPersistence(
        data.stylistId,
        data.serviceId,
        data.customPrice ? Number(data.customPrice) : undefined,
        data.isOffering ?? true,
        data.createdAt,
        data.updatedAt,
      ),
    );
  }

  /**
   * Busca todos los estilistas que están ofreciendo activamente un servicio específico
   * @param serviceId - ID único del servicio
   * @returns Promise que resuelve con un array de asignaciones activas para el servicio
   */
  async findStylistsOfferingService(serviceId: string): Promise<StylistService[]> {
    const stylistServicesData = await this.prisma.stylistService.findMany({
      where: {
        serviceId,
        isOffering: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return stylistServicesData.map((data) =>
      StylistService.fromPersistence(
        data.stylistId,
        data.serviceId,
        data.customPrice ? Number(data.customPrice) : undefined,
        data.isOffering ?? true,
        data.createdAt,
        data.updatedAt,
      ),
    );
  }

  /**
   * Guarda una nueva asignación estilista-servicio en la base de datos
   * @param stylistService - Entidad de asignación a guardar
   * @returns Promise que resuelve con la asignación guardada
   */
  async save(stylistService: StylistService): Promise<StylistService> {
    const stylistServiceData = await this.prisma.stylistService.create({
      data: {
        stylistId: stylistService.stylistId,
        serviceId: stylistService.serviceId,
        customPrice: stylistService.customPrice,
        isOffering: stylistService.isOffering,
        createdAt: stylistService.createdAt,
        updatedAt: stylistService.updatedAt,
      },
    });

    return StylistService.fromPersistence(
      stylistServiceData.stylistId,
      stylistServiceData.serviceId,
      stylistServiceData.customPrice ? Number(stylistServiceData.customPrice) : undefined,
      stylistServiceData.isOffering ?? true,
      stylistServiceData.createdAt,
      stylistServiceData.updatedAt,
    );
  }

  /**
   * Actualiza una asignación estilista-servicio existente usando clave compuesta
   * @param stylistService - Entidad de asignación con los datos actualizados
   * @returns Promise que resuelve con la asignación actualizada
   */
  async update(stylistService: StylistService): Promise<StylistService> {
    const stylistServiceData = await this.prisma.stylistService.update({
      where: {
        stylistId_serviceId: {
          stylistId: stylistService.stylistId,
          serviceId: stylistService.serviceId,
        },
      },
      data: {
        customPrice: stylistService.customPrice,
        isOffering: stylistService.isOffering,
        updatedAt: stylistService.updatedAt,
      },
    });

    return StylistService.fromPersistence(
      stylistServiceData.stylistId,
      stylistServiceData.serviceId,
      stylistServiceData.customPrice ? Number(stylistServiceData.customPrice) : undefined,
      stylistServiceData.isOffering ?? true,
      stylistServiceData.createdAt,
      stylistServiceData.updatedAt,
    );
  }

  /**
   * Elimina una asignación estilista-servicio usando clave compuesta
   * @param stylistId - ID único del estilista
   * @param serviceId - ID único del servicio
   * @returns Promise que resuelve cuando la eliminación se completa
   */
  async delete(stylistId: string, serviceId: string): Promise<void> {
    await this.prisma.stylistService.delete({
      where: {
        stylistId_serviceId: {
          stylistId,
          serviceId,
        },
      },
    });
  }

  /**
   * Verifica si existe una asignación entre un estilista y un servicio específicos
   * @param stylistId - ID único del estilista
   * @param serviceId - ID único del servicio
   * @returns Promise que resuelve con true si existe la asignación, false en caso contrario
   */
  async existsAssignment(stylistId: string, serviceId: string): Promise<boolean> {
    const count = await this.prisma.stylistService.count({
      where: {
        stylistId,
        serviceId,
      },
    });
    return count > 0;
  }
}
