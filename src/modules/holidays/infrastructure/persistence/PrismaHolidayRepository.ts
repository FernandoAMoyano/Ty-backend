import { PrismaClient, Holiday as PrismaHoliday } from '@prisma/client';
import { Holiday } from '../../domain/entities/Holiday';
import {
  IHolidayRepository,
  HolidayFilters,
  PaginationOptions,
  PaginatedResult,
} from '../../domain/repositories/IHolidayRepository';

/**
 * Implementación del repositorio de feriados con Prisma
 * @description Gestiona la persistencia de feriados en la base de datos
 */
export class PrismaHolidayRepository implements IHolidayRepository {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Convierte un registro de Prisma a entidad de dominio
   * @private
   */
  private toDomain(prismaHoliday: PrismaHoliday): Holiday {
    return new Holiday({
      id: prismaHoliday.id,
      name: prismaHoliday.name,
      date: prismaHoliday.date,
      description: prismaHoliday.description,
      createdAt: prismaHoliday.createdAt,
      updatedAt: prismaHoliday.updatedAt,
    });
  }

  /**
   * Guarda un nuevo feriado
   */
  async save(holiday: Holiday): Promise<Holiday> {
    const data = holiday.toObject();

    const created = await this.prisma.holiday.create({
      data: {
        id: data.id,
        name: data.name,
        date: data.date,
        description: data.description,
      },
    });

    return this.toDomain(created);
  }

  /**
   * Busca un feriado por su ID
   */
  async findById(id: string): Promise<Holiday | null> {
    const holiday = await this.prisma.holiday.findUnique({
      where: { id },
    });

    return holiday ? this.toDomain(holiday) : null;
  }

  /**
   * Busca feriados por año
   */
  async findByYear(year: number): Promise<Holiday[]> {
    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year, 11, 31);

    const holidays = await this.prisma.holiday.findMany({
      where: {
        date: {
          gte: startOfYear,
          lte: endOfYear,
        },
      },
      orderBy: { date: 'asc' },
    });

    return holidays.map(h => this.toDomain(h));
  }

  /**
   * Busca un feriado por fecha exacta
   */
  async findByDate(date: Date): Promise<Holiday | null> {
    // Normalizar la fecha para buscar solo por día
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const holiday = await this.prisma.holiday.findFirst({
      where: {
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    return holiday ? this.toDomain(holiday) : null;
  }

  /**
   * Busca todos los feriados con filtros opcionales
   */
  async findAll(
    filters?: HolidayFilters,
    pagination?: PaginationOptions,
  ): Promise<PaginatedResult<Holiday>> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 10;
    const skip = (page - 1) * limit;

    // Construir condiciones de filtro
    const where: any = {};

    if (filters?.year) {
      const startOfYear = new Date(filters.year, 0, 1);
      const endOfYear = new Date(filters.year, 11, 31);
      where.date = {
        ...where.date,
        gte: startOfYear,
        lte: endOfYear,
      };
    }

    if (filters?.month && filters?.year) {
      const startOfMonth = new Date(filters.year, filters.month - 1, 1);
      const endOfMonth = new Date(filters.year, filters.month, 0);
      where.date = {
        gte: startOfMonth,
        lte: endOfMonth,
      };
    }

    if (filters?.startDate) {
      where.date = {
        ...where.date,
        gte: filters.startDate,
      };
    }

    if (filters?.endDate) {
      where.date = {
        ...where.date,
        lte: filters.endDate,
      };
    }

    if (filters?.name) {
      where.name = {
        contains: filters.name,
        mode: 'insensitive',
      };
    }

    // Ejecutar consultas
    const [holidays, total] = await Promise.all([
      this.prisma.holiday.findMany({
        where,
        skip,
        take: limit,
        orderBy: { date: 'asc' },
      }),
      this.prisma.holiday.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: holidays.map(h => this.toDomain(h)),
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };
  }

  /**
   * Busca feriados en un rango de fechas
   */
  async findByDateRange(startDate: Date, endDate: Date): Promise<Holiday[]> {
    const holidays = await this.prisma.holiday.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { date: 'asc' },
    });

    return holidays.map(h => this.toDomain(h));
  }

  /**
   * Busca feriados próximos (futuros)
   */
  async findUpcoming(limit: number = 5): Promise<Holiday[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const holidays = await this.prisma.holiday.findMany({
      where: {
        date: {
          gte: today,
        },
      },
      orderBy: { date: 'asc' },
      take: limit,
    });

    return holidays.map(h => this.toDomain(h));
  }

  /**
   * Actualiza un feriado existente
   */
  async update(holiday: Holiday): Promise<Holiday> {
    const data = holiday.toObject();

    const updated = await this.prisma.holiday.update({
      where: { id: data.id },
      data: {
        name: data.name,
        date: data.date,
        description: data.description,
        updatedAt: new Date(),
      },
    });

    return this.toDomain(updated);
  }

  /**
   * Elimina un feriado por su ID
   */
  async delete(id: string): Promise<boolean> {
    await this.prisma.holiday.delete({
      where: { id },
    });

    return true;
  }

  /**
   * Verifica si existe un feriado en una fecha específica
   */
  async existsByDate(date: Date, excludeId?: string): Promise<boolean> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const where: any = {
      date: {
        gte: startOfDay,
        lte: endOfDay,
      },
    };

    if (excludeId) {
      where.id = { not: excludeId };
    }

    const count = await this.prisma.holiday.count({ where });

    return count > 0;
  }

  /**
   * Verifica si una fecha es feriado
   */
  async isHoliday(date: Date): Promise<boolean> {
    return this.existsByDate(date);
  }
}
