import { PrismaClient, ScheduleException as PrismaScheduleException } from '@prisma/client';
import { ScheduleException } from '../../domain/entities/ScheduleException';
import {
  IScheduleExceptionRepository,
  ScheduleExceptionFilters,
  PaginationOptions,
  PaginatedResult,
} from '../../domain/repositories/IScheduleExceptionRepository';

/**
 * Implementación del repositorio de excepciones de horario con Prisma
 * @description Gestiona la persistencia de excepciones de horario en la base de datos
 */
export class PrismaScheduleExceptionRepository implements IScheduleExceptionRepository {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Convierte un registro de Prisma a entidad de dominio
   * @private
   */
  private toDomain(prismaException: PrismaScheduleException): ScheduleException {
    return new ScheduleException({
      id: prismaException.id,
      exceptionDate: prismaException.exceptionDate,
      startTimeException: prismaException.startTimeException,
      endTimeException: prismaException.endTimeException,
      reason: prismaException.reason,
      holidayId: prismaException.holidayId,
      createdAt: prismaException.createdAt,
      updatedAt: prismaException.updatedAt,
    });
  }

  /**
   * Guarda una nueva excepción
   */
  async save(exception: ScheduleException): Promise<ScheduleException> {
    const data = exception.toObject();

    const created = await this.prisma.scheduleException.create({
      data: {
        id: data.id,
        exceptionDate: data.exceptionDate,
        startTimeException: data.startTimeException,
        endTimeException: data.endTimeException,
        reason: data.reason,
        holidayId: data.holidayId,
      },
    });

    return this.toDomain(created);
  }

  /**
   * Busca una excepción por su ID
   */
  async findById(id: string): Promise<ScheduleException | null> {
    const exception = await this.prisma.scheduleException.findUnique({
      where: { id },
    });

    return exception ? this.toDomain(exception) : null;
  }

  /**
   * Busca excepciones por fecha
   */
  async findByDate(date: Date): Promise<ScheduleException[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const exceptions = await this.prisma.scheduleException.findMany({
      where: {
        exceptionDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      orderBy: { exceptionDate: 'asc' },
    });

    return exceptions.map(e => this.toDomain(e));
  }

  /**
   * Busca excepciones por ID de feriado
   */
  async findByHolidayId(holidayId: string): Promise<ScheduleException[]> {
    const exceptions = await this.prisma.scheduleException.findMany({
      where: { holidayId },
      orderBy: { exceptionDate: 'asc' },
    });

    return exceptions.map(e => this.toDomain(e));
  }

  /**
   * Busca todas las excepciones con filtros opcionales
   */
  async findAll(
    filters?: ScheduleExceptionFilters,
    pagination?: PaginationOptions,
  ): Promise<PaginatedResult<ScheduleException>> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 10;
    const skip = (page - 1) * limit;

    // Construir condiciones de filtro
    const where: any = {};

    if (filters?.startDate) {
      where.exceptionDate = {
        ...where.exceptionDate,
        gte: filters.startDate,
      };
    }

    if (filters?.endDate) {
      where.exceptionDate = {
        ...where.exceptionDate,
        lte: filters.endDate,
      };
    }

    if (filters?.holidayId) {
      where.holidayId = filters.holidayId;
    }

    if (filters?.reason) {
      where.reason = {
        contains: filters.reason,
        mode: 'insensitive',
      };
    }

    // Ejecutar consultas
    const [exceptions, total] = await Promise.all([
      this.prisma.scheduleException.findMany({
        where,
        skip,
        take: limit,
        orderBy: { exceptionDate: 'asc' },
      }),
      this.prisma.scheduleException.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: exceptions.map(e => this.toDomain(e)),
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };
  }

  /**
   * Busca excepciones en un rango de fechas
   */
  async findByDateRange(startDate: Date, endDate: Date): Promise<ScheduleException[]> {
    const exceptions = await this.prisma.scheduleException.findMany({
      where: {
        exceptionDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { exceptionDate: 'asc' },
    });

    return exceptions.map(e => this.toDomain(e));
  }

  /**
   * Busca excepciones próximas (futuras)
   */
  async findUpcoming(limit: number = 5): Promise<ScheduleException[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const exceptions = await this.prisma.scheduleException.findMany({
      where: {
        exceptionDate: {
          gte: today,
        },
      },
      orderBy: { exceptionDate: 'asc' },
      take: limit,
    });

    return exceptions.map(e => this.toDomain(e));
  }

  /**
   * Actualiza una excepción existente
   */
  async update(exception: ScheduleException): Promise<ScheduleException> {
    const data = exception.toObject();

    const updated = await this.prisma.scheduleException.update({
      where: { id: data.id },
      data: {
        exceptionDate: data.exceptionDate,
        startTimeException: data.startTimeException,
        endTimeException: data.endTimeException,
        reason: data.reason,
        holidayId: data.holidayId,
        updatedAt: new Date(),
      },
    });

    return this.toDomain(updated);
  }

  /**
   * Elimina una excepción por su ID
   */
  async delete(id: string): Promise<boolean> {
    await this.prisma.scheduleException.delete({
      where: { id },
    });

    return true;
  }

  /**
   * Elimina todas las excepciones asociadas a un feriado
   */
  async deleteByHolidayId(holidayId: string): Promise<number> {
    const result = await this.prisma.scheduleException.deleteMany({
      where: { holidayId },
    });

    return result.count;
  }

  /**
   * Verifica si existe una excepción en una fecha específica
   */
  async existsByDate(date: Date, excludeId?: string): Promise<boolean> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const where: any = {
      exceptionDate: {
        gte: startOfDay,
        lte: endOfDay,
      },
    };

    if (excludeId) {
      where.id = { not: excludeId };
    }

    const count = await this.prisma.scheduleException.count({ where });

    return count > 0;
  }

  /**
   * Obtiene la excepción de horario para una fecha (si existe)
   */
  async getExceptionForDate(date: Date): Promise<ScheduleException | null> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const exception = await this.prisma.scheduleException.findFirst({
      where: {
        exceptionDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    return exception ? this.toDomain(exception) : null;
  }
}
