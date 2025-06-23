import { PrismaClient } from '@prisma/client';
import { StylistService } from '../../domain/entities/StylistService';
import { StylistServiceRepository } from '../../domain/repositories/StylistServiceRepository';

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
