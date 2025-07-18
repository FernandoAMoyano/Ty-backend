import { PrismaClient } from '@prisma/client';
import { Schedule, DayOfWeekEnum } from '../../domain/entities/Schedule';
import { ScheduleRepository } from '../../domain/repositories/ScheduleRepository';

/**
 * Implementación de ScheduleRepository usando Prisma ORM
 * Proporciona persistencia de datos de horarios en base de datos relacional
 */
export class PrismaScheduleRepository implements ScheduleRepository {
  /**
   * Constructor que inyecta el cliente Prisma
   * @param prisma - Cliente Prisma para acceso a base de datos
   */
  constructor(private prisma: PrismaClient) {}

  /**
   * Busca un horario por su ID único
   * @param id - ID único del horario
   * @returns Promise que resuelve con el horario encontrado o null si no existe
   */
  async findById(id: string): Promise<Schedule | null> {
    const scheduleData = await this.prisma.schedule.findUnique({
      where: { id },
    });

    if (!scheduleData) return null;

    return Schedule.fromPersistence(
      scheduleData.id,
      scheduleData.dayOfWeek as DayOfWeekEnum,
      scheduleData.startTime,
      scheduleData.endTime,
      scheduleData.createdAt,
      scheduleData.updatedAt,
      scheduleData.holidayId || undefined,
    );
  }

  /**
   * Obtiene todos los horarios del sistema
   * @returns Promise que resuelve con un array de todos los horarios
   */
  async findAll(): Promise<Schedule[]> {
    const schedulesData = await this.prisma.schedule.findMany({
      orderBy: [
        { dayOfWeek: 'asc' },
        { startTime: 'asc' },
      ],
    });

    return schedulesData.map(scheduleData =>
      Schedule.fromPersistence(
        scheduleData.id,
        scheduleData.dayOfWeek as DayOfWeekEnum,
        scheduleData.startTime,
        scheduleData.endTime,
        scheduleData.createdAt,
        scheduleData.updatedAt,
        scheduleData.holidayId || undefined,
      ),
    );
  }

  /**
   * Guarda un nuevo horario en el sistema
   * @param schedule - Entidad de horario a guardar
   * @returns Promise que resuelve con el horario guardado
   */
  async save(schedule: Schedule): Promise<Schedule> {
    const scheduleData = await this.prisma.schedule.create({
      data: {
        id: schedule.id,
        dayOfWeek: schedule.dayOfWeek,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        createdAt: schedule.createdAt,
        updatedAt: schedule.updatedAt,
        holidayId: schedule.holidayId,
      },
    });

    return Schedule.fromPersistence(
      scheduleData.id,
      scheduleData.dayOfWeek as DayOfWeekEnum,
      scheduleData.startTime,
      scheduleData.endTime,
      scheduleData.createdAt,
      scheduleData.updatedAt,
      scheduleData.holidayId || undefined,
    );
  }

  /**
   * Actualiza un horario existente
   * @param schedule - Entidad de horario con datos actualizados
   * @returns Promise que resuelve con el horario actualizado
   */
  async update(schedule: Schedule): Promise<Schedule> {
    const scheduleData = await this.prisma.schedule.update({
      where: { id: schedule.id },
      data: {
        dayOfWeek: schedule.dayOfWeek,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        updatedAt: schedule.updatedAt,
        holidayId: schedule.holidayId,
      },
    });

    return Schedule.fromPersistence(
      scheduleData.id,
      scheduleData.dayOfWeek as DayOfWeekEnum,
      scheduleData.startTime,
      scheduleData.endTime,
      scheduleData.createdAt,
      scheduleData.updatedAt,
      scheduleData.holidayId || undefined,
    );
  }

  /**
   * Elimina un horario del sistema
   * @param id - ID único del horario a eliminar
   */
  async delete(id: string): Promise<void> {
    await this.prisma.schedule.delete({
      where: { id },
    });
  }

  /**
   * Verifica si existe un horario con el ID especificado
   * @param id - ID único del horario a verificar
   * @returns Promise que resuelve con true si existe, false en caso contrario
   */
  async existsById(id: string): Promise<boolean> {
    const count = await this.prisma.schedule.count({
      where: { id },
    });
    return count > 0;
  }

  /**
   * Busca horarios por día de la semana
   * @param dayOfWeek - Día de la semana a buscar
   * @returns Promise que resuelve con un array de horarios para ese día
   */
  async findByDayOfWeek(dayOfWeek: DayOfWeekEnum): Promise<Schedule[]> {
    const schedulesData = await this.prisma.schedule.findMany({
      where: { dayOfWeek },
      orderBy: { startTime: 'asc' },
    });

    return schedulesData.map(scheduleData =>
      Schedule.fromPersistence(
        scheduleData.id,
        scheduleData.dayOfWeek as DayOfWeekEnum,
        scheduleData.startTime,
        scheduleData.endTime,
        scheduleData.createdAt,
        scheduleData.updatedAt,
        scheduleData.holidayId || undefined,
      ),
    );
  }

  /**
   * Busca horarios asociados a un feriado específico
   * @param holidayId - ID único del feriado
   * @returns Promise que resuelve con un array de horarios para el feriado
   */
  async findByHolidayId(holidayId: string): Promise<Schedule[]> {
    const schedulesData = await this.prisma.schedule.findMany({
      where: { holidayId },
      orderBy: [
        { dayOfWeek: 'asc' },
        { startTime: 'asc' },
      ],
    });

    return schedulesData.map(scheduleData =>
      Schedule.fromPersistence(
        scheduleData.id,
        scheduleData.dayOfWeek as DayOfWeekEnum,
        scheduleData.startTime,
        scheduleData.endTime,
        scheduleData.createdAt,
        scheduleData.updatedAt,
        scheduleData.holidayId || undefined,
      ),
    );
  }

  /**
   * Busca horarios regulares (sin feriados)
   * @returns Promise que resuelve con un array de horarios regulares
   */
  async findRegularSchedule(): Promise<Schedule[]> {
    const schedulesData = await this.prisma.schedule.findMany({
      where: { holidayId: null },
      orderBy: [
        { dayOfWeek: 'asc' },
        { startTime: 'asc' },
      ],
    });

    return schedulesData.map(scheduleData =>
      Schedule.fromPersistence(
        scheduleData.id,
        scheduleData.dayOfWeek as DayOfWeekEnum,
        scheduleData.startTime,
        scheduleData.endTime,
        scheduleData.createdAt,
        scheduleData.updatedAt,
        scheduleData.holidayId || undefined,
      ),
    );
  }

  /**
   * Busca horarios especiales (asociados a feriados)
   * @returns Promise que resuelve con un array de horarios de feriados
   */
  async findHolidaySchedule(): Promise<Schedule[]> {
    const schedulesData = await this.prisma.schedule.findMany({
      where: { holidayId: { not: null } },
      orderBy: [
        { dayOfWeek: 'asc' },
        { startTime: 'asc' },
      ],
    });

    return schedulesData.map(scheduleData =>
      Schedule.fromPersistence(
        scheduleData.id,
        scheduleData.dayOfWeek as DayOfWeekEnum,
        scheduleData.startTime,
        scheduleData.endTime,
        scheduleData.createdAt,
        scheduleData.updatedAt,
        scheduleData.holidayId || undefined,
      ),
    );
  }

  /**
   * Busca horarios disponibles para un día específico
   * @param dayOfWeek - Día de la semana a consultar
   * @returns Promise que resuelve con un array de horarios disponibles
   */
  async findAvailableSchedulesForDay(dayOfWeek: DayOfWeekEnum): Promise<Schedule[]> {
    return this.findByDayOfWeek(dayOfWeek);
  }

  /**
   * Busca un horario que contenga un slot de tiempo específico
   * @param dayOfWeek - Día de la semana del slot
   * @param time - Hora específica en formato HH:MM
   * @returns Promise que resuelve con el horario que contiene el slot
   */
  async findScheduleByTimeSlot(dayOfWeek: DayOfWeekEnum, time: string): Promise<Schedule | null> {
    const schedulesData = await this.prisma.schedule.findMany({
      where: { dayOfWeek },
    });

    for (const scheduleData of schedulesData) {
      const schedule = Schedule.fromPersistence(
        scheduleData.id,
        scheduleData.dayOfWeek as DayOfWeekEnum,
        scheduleData.startTime,
        scheduleData.endTime,
        scheduleData.createdAt,
        scheduleData.updatedAt,
        scheduleData.holidayId || undefined,
      );

      if (schedule.isWithinWorkingHours(time)) {
        return schedule;
      }
    }

    return null;
  }

  /**
   * Busca horarios que puedan tener conflicto con un nuevo horario
   * @param dayOfWeek - Día de la semana del nuevo horario
   * @param startTime - Hora de inicio del nuevo horario
   * @param endTime - Hora de fin del nuevo horario
   * @param excludeScheduleId - ID de horario a excluir
   * @returns Promise que resuelve con un array de horarios en conflicto
   */
  async findConflictingSchedules(
    dayOfWeek: DayOfWeekEnum,
    startTime: string,
    endTime: string,
    excludeScheduleId?: string,
  ): Promise<Schedule[]> {
    const whereClause: any = {
      dayOfWeek,
      OR: [
        {
          AND: [
            { startTime: { lt: endTime } },
            { endTime: { gt: startTime } },
          ],
        },
      ],
    };

    if (excludeScheduleId) {
      whereClause.id = { not: excludeScheduleId };
    }

    const schedulesData = await this.prisma.schedule.findMany({
      where: whereClause,
    });

    return schedulesData.map(scheduleData =>
      Schedule.fromPersistence(
        scheduleData.id,
        scheduleData.dayOfWeek as DayOfWeekEnum,
        scheduleData.startTime,
        scheduleData.endTime,
        scheduleData.createdAt,
        scheduleData.updatedAt,
        scheduleData.holidayId || undefined,
      ),
    );
  }
}
