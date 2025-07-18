import { PrismaClient } from '@prisma/client';
import { Appointment } from '../../domain/entities/Appointment';
import { AppointmentRepository } from '../../domain/repositories/AppointmentRepository';

/**
 * Implementación de AppointmentRepository usando Prisma ORM
 * Proporciona persistencia de datos de citas en base de datos relacional
 */
export class PrismaAppointmentRepository implements AppointmentRepository {
  /**
   * Constructor que inyecta el cliente Prisma
   * @param prisma - Cliente Prisma para acceso a base de datos
   */
  constructor(private prisma: PrismaClient) {}

  /**
   * Busca una cita por su ID único
   * @param id - ID único de la cita
   * @returns Promise que resuelve con la cita encontrada o null si no existe
   */
  async findById(id: string): Promise<Appointment | null> {
    const appointmentData = await this.prisma.appointment.findUnique({
      where: { id },
      include: {
        services: true,
      },
    });

    if (!appointmentData) return null;

    return this.mapToEntity(appointmentData);
  }

  /**
   * Obtiene todas las citas del sistema
   * @returns Promise que resuelve con un array de todas las citas
   */
  async findAll(): Promise<Appointment[]> {
    const appointmentsData = await this.prisma.appointment.findMany({
      include: {
        services: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return appointmentsData.map((data) => this.mapToEntity(data));
  }

  /**
   * Guarda una nueva cita en el sistema
   * @param appointment - Entidad de cita a guardar
   * @returns Promise que resuelve con la cita guardada
   */
  async save(appointment: Appointment): Promise<Appointment> {
    const appointmentData = await this.prisma.appointment.create({
      data: {
        id: appointment.id,
        dateTime: appointment.dateTime,
        duration: appointment.duration,
        userId: appointment.userId,
        clientId: appointment.clientId,
        scheduleId: appointment.scheduleId,
        statusId: appointment.statusId,
        stylistId: appointment.stylistId,
        confirmedAt: appointment.confirmedAt,
        createdAt: appointment.createdAt,
        updatedAt: appointment.updatedAt,
        services: {
          connect: appointment.serviceIds.map((id) => ({ id })),
        },
      },
      include: {
        services: true,
      },
    });

    return this.mapToEntity(appointmentData);
  }

  /**
   * Actualiza una cita existente
   * @param appointment - Entidad de cita con datos actualizados
   * @returns Promise que resuelve con la cita actualizada
   */
  async update(appointment: Appointment): Promise<Appointment> {
    const appointmentData = await this.prisma.appointment.update({
      where: { id: appointment.id },
      data: {
        dateTime: appointment.dateTime,
        duration: appointment.duration,
        statusId: appointment.statusId,
        stylistId: appointment.stylistId,
        confirmedAt: appointment.confirmedAt,
        updatedAt: appointment.updatedAt,
        services: {
          set: appointment.serviceIds.map((id) => ({ id })),
        },
      },
      include: {
        services: true,
      },
    });

    return this.mapToEntity(appointmentData);
  }

  /**
   * Elimina una cita del sistema
   * @param id - ID único de la cita a eliminar
   */
  async delete(id: string): Promise<void> {
    await this.prisma.appointment.delete({
      where: { id },
    });
  }

  /**
   * Verifica si existe una cita con el ID especificado
   * @param id - ID único de la cita a verificar
   * @returns Promise que resuelve con true si existe, false en caso contrario
   */
  async existsById(id: string): Promise<boolean> {
    const count = await this.prisma.appointment.count({
      where: { id },
    });
    return count > 0;
  }

  /**
   * Busca todas las citas de un cliente específico
   * @param clientId - ID único del cliente
   * @returns Promise que resuelve con un array de citas del cliente
   */
  async findByClientId(clientId: string): Promise<Appointment[]> {
    const appointmentsData = await this.prisma.appointment.findMany({
      where: { clientId },
      include: {
        services: true,
      },
      orderBy: { dateTime: 'desc' },
    });

    return appointmentsData.map((data) => this.mapToEntity(data));
  }

  /**
   * Busca todas las citas de un estilista específico
   * @param stylistId - ID único del estilista
   * @returns Promise que resuelve con un array de citas del estilista
   */
  async findByStylistId(stylistId: string): Promise<Appointment[]> {
    const appointmentsData = await this.prisma.appointment.findMany({
      where: { stylistId },
      include: {
        services: true,
      },
      orderBy: { dateTime: 'desc' },
    });

    return appointmentsData.map((data) => this.mapToEntity(data));
  }

  /**
   * Busca todas las citas creadas por un usuario específico
   * @param userId - ID único del usuario creador
   * @returns Promise que resuelve con un array de citas del usuario
   */
  async findByUserId(userId: string): Promise<Appointment[]> {
    const appointmentsData = await this.prisma.appointment.findMany({
      where: { userId },
      include: {
        services: true,
      },
      orderBy: { dateTime: 'desc' },
    });

    return appointmentsData.map((data) => this.mapToEntity(data));
  }

  /**
   * Busca todas las citas con un estado específico
   * @param statusId - ID único del estado
   * @returns Promise que resuelve con un array de citas con ese estado
   */
  async findByStatusId(statusId: string): Promise<Appointment[]> {
    const appointmentsData = await this.prisma.appointment.findMany({
      where: { statusId },
      include: {
        services: true,
      },
      orderBy: { dateTime: 'desc' },
    });

    return appointmentsData.map((data) => this.mapToEntity(data));
  }

  /**
   * Busca citas dentro de un rango de fechas
   * @param startDate - Fecha de inicio del rango
   * @param endDate - Fecha de fin del rango
   * @returns Promise que resuelve con un array de citas en el rango
   */
  async findByDateRange(startDate: Date, endDate: Date): Promise<Appointment[]> {
    const appointmentsData = await this.prisma.appointment.findMany({
      where: {
        dateTime: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        services: true,
      },
      orderBy: { dateTime: 'asc' },
    });

    return appointmentsData.map((data) => this.mapToEntity(data));
  }

  /**
   * Busca citas de un cliente en un rango de fechas
   * @param clientId - ID único del cliente
   * @param startDate - Fecha de inicio del rango
   * @param endDate - Fecha de fin del rango
   * @returns Promise que resuelve con un array de citas del cliente
   */
  async findByClientAndDateRange(
    clientId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<Appointment[]> {
    const appointmentsData = await this.prisma.appointment.findMany({
      where: {
        clientId,
        dateTime: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        services: true,
      },
      orderBy: { dateTime: 'asc' },
    });

    return appointmentsData.map((data) => this.mapToEntity(data));
  }

  /**
   * Busca citas de un estilista en un rango de fechas
   * @param stylistId - ID único del estilista
   * @param startDate - Fecha de inicio del rango
   * @param endDate - Fecha de fin del rango
   * @returns Promise que resuelve con un array de citas del estilista
   */
  async findByStylistAndDateRange(
    stylistId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<Appointment[]> {
    const appointmentsData = await this.prisma.appointment.findMany({
      where: {
        stylistId,
        dateTime: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        services: true,
      },
      orderBy: { dateTime: 'asc' },
    });

    return appointmentsData.map((data) => this.mapToEntity(data));
  }

  /**
   * Busca citas que puedan tener conflicto de horario
   * @param dateTime - Fecha y hora de la nueva cita
   * @param duration - Duración en minutos de la nueva cita
   * @param stylistId - ID del estilista (opcional)
   * @param excludeAppointmentId - ID de cita a excluir
   * @returns Promise que resuelve con un array de citas en conflicto
   */
  async findConflictingAppointments(
    dateTime: Date,
    duration: number,
    stylistId?: string,
    excludeAppointmentId?: string,
  ): Promise<Appointment[]> {
    const endTime = new Date(dateTime.getTime() + duration * 60000);

    const whereClause: any = {
      AND: [
        {
          dateTime: {
            lt: endTime,
          },
        },
        {
          OR: [
            {
              dateTime: {
                gte: dateTime,
              },
            },
            {
              dateTime: {
                lt: dateTime,
              },
            },
          ],
        },
      ],
    };

    if (stylistId) {
      whereClause.stylistId = stylistId;
    }

    if (excludeAppointmentId) {
      whereClause.id = {
        not: excludeAppointmentId,
      };
    }

    const appointmentsData = await this.prisma.appointment.findMany({
      where: whereClause,
      include: {
        services: true,
      },
    });

    const appointments = appointmentsData.map((data) => this.mapToEntity(data));

    // Filtrar manualmente los conflictos reales
    return appointments.filter((appointment) => {
      const appointmentEndTime = new Date(
        appointment.dateTime.getTime() + appointment.duration * 60000,
      );
      return !(endTime <= appointment.dateTime || dateTime >= appointmentEndTime);
    });
  }

  /**
   * Busca citas asociadas a un horario específico
   * @param scheduleId - ID único del horario
   * @returns Promise que resuelve con un array de citas del horario
   */
  async findByScheduleId(scheduleId: string): Promise<Appointment[]> {
    const appointmentsData = await this.prisma.appointment.findMany({
      where: { scheduleId },
      include: {
        services: true,
      },
      orderBy: { dateTime: 'asc' },
    });

    return appointmentsData.map((data) => this.mapToEntity(data));
  }

  /**
   * Busca citas para una fecha específica
   * @param date - Fecha para buscar citas
   * @returns Promise que resuelve con un array de citas del día
   */
  async findByDate(date: Date): Promise<Appointment[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return this.findByDateRange(startOfDay, endOfDay);
  }

  /**
   * Cuenta citas con un estado específico
   * @param statusId - ID único del estado
   * @returns Promise que resuelve con el número de citas
   */
  async countByStatus(statusId: string): Promise<number> {
    return await this.prisma.appointment.count({
      where: { statusId },
    });
  }

  /**
   * Cuenta citas en un rango de fechas
   * @param startDate - Fecha de inicio del conteo
   * @param endDate - Fecha de fin del conteo
   * @returns Promise que resuelve con el número de citas
   */
  async countByDateRange(startDate: Date, endDate: Date): Promise<number> {
    return await this.prisma.appointment.count({
      where: {
        dateTime: {
          gte: startDate,
          lte: endDate,
        },
      },
    });
  }

  /**
   * Busca próximas citas ordenadas por fecha
   * @param limit - Número máximo de citas a retornar
   * @returns Promise que resuelve con un array de citas próximas
   */
  async findUpcomingAppointments(limit?: number): Promise<Appointment[]> {
    const appointmentsData = await this.prisma.appointment.findMany({
      where: {
        dateTime: {
          gte: new Date(),
        },
      },
      include: {
        services: true,
      },
      orderBy: { dateTime: 'asc' },
      take: limit,
    });

    return appointmentsData.map((data) => this.mapToEntity(data));
  }

  /**
   * Busca citas pendientes de confirmación
   * @returns Promise que resuelve con un array de citas pendientes
   */
  async findPendingConfirmation(): Promise<Appointment[]> {
    const appointmentsData = await this.prisma.appointment.findMany({
      where: {
        confirmedAt: null,
        status: {
          name: 'Pendiente',
        },
      },
      include: {
        services: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    return appointmentsData.map((data) => this.mapToEntity(data));
  }

  /**
   * Mapea datos de Prisma a entidad de dominio
   * @param appointmentData - Datos de la cita desde Prisma
   * @returns Entidad Appointment
   */
  private mapToEntity(appointmentData: any): Appointment {
    return Appointment.fromPersistence(
      appointmentData.id,
      appointmentData.dateTime,
      appointmentData.duration,
      appointmentData.userId,
      appointmentData.clientId,
      appointmentData.scheduleId,
      appointmentData.statusId,
      appointmentData.stylistId,
      appointmentData.confirmedAt,
      appointmentData.services?.map((service: any) => service.id) || [],
      appointmentData.createdAt,
      appointmentData.updatedAt,
    );
  }
}
