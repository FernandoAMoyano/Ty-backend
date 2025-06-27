import { PrismaClient } from '@prisma/client';
import { StylistRepository } from '../../domain/repositories/StylistRepository';
import { Stylist } from '../../domain/entities/Stylist';

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

  async delete(id: string): Promise<void> {
    await this.prisma.stylist.delete({
      where: { id },
    });
  }

  async existsById(id: string): Promise<boolean> {
    const count = await this.prisma.stylist.count({
      where: { id },
    });
    return count > 0;
  }
}
