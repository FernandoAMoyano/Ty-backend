import { Prisma, PrismaClient } from '@prisma/client';
import { Appointment } from '../../domain/entities/Appointment';
import { IAppointmentRepository } from '../../domain/repositories/IAppointmentRepository';

/**
 * Payload de Prisma para una cita con sus servicios asociados incluidos
 * (mismo include usado en todas las consultas de este repositorio)
 */
type AppointmentWithServices = Prisma.AppointmentGetPayload<{
  include: { services: true };
}>;

/**
 * ID imposible usado para forzar un WHERE que no matchea ninguna fila.
 * Se usa cuando se pasó un ownershipFilter pero ninguno de sus campos
 * tenía valor: en vez de degradar silenciosamente a "sin filtro" (F17,
 * hallazgo de auditoría), la consulta falla cerrada devolviendo 0 filas.
 */
const NO_OWNERSHIP_MATCH_ID = '__no_ownership_filter_match__';

/**
 * Implementación de AppointmentRepository usando Prisma ORM
 * Proporciona persistencia de datos de citas en base de datos relacional
 */
export class PrismaAppointmentRepository implements IAppointmentRepository {
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
        cancellationReason: appointment.cancellationReason,
        cancelledBy: appointment.cancelledBy,
        confirmationNotes: appointment.confirmationNotes,
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
   * Busca citas de un cliente de forma paginada, aplicando el ownershipFilter
   * directamente en el WHERE (no en memoria -- ver F17/F3)
   * @param clientId - ID único del cliente
   * @param limit - Cantidad máxima de resultados
   * @param offset - Cantidad de resultados a saltar
   * @param ownershipFilter - Restricción adicional (OR) cuando el requester
   * es un STYLIST que solo puede ver las citas donde es el estilista
   * asignado o el creador
   * @returns Promise que resuelve con la página de citas del cliente
   */
  async findByClientIdPaginated(
    clientId: string,
    limit: number,
    offset: number,
    ownershipFilter?: { stylistId?: string; userId?: string },
  ): Promise<Appointment[]> {
    const where = this.buildClientOwnershipWhere(clientId, ownershipFilter);

    const appointmentsData = await this.prisma.appointment.findMany({
      where,
      include: {
        services: true,
      },
      orderBy: { dateTime: 'desc' },
      skip: offset,
      take: limit,
    });

    return appointmentsData.map((data) => this.mapToEntity(data));
  }

  /**
   * Cuenta las citas de un cliente aplicando el mismo ownershipFilter que
   * findByClientIdPaginated, para que total/totalPages reflejen el filtro
   * real y no el total sin filtrar (ver F17/F3)
   */
  async countByClientId(
    clientId: string,
    ownershipFilter?: { stylistId?: string; userId?: string },
  ): Promise<number> {
    const where = this.buildClientOwnershipWhere(clientId, ownershipFilter);
    return this.prisma.appointment.count({ where });
  }

  /**
   * Construye el WHERE compartido entre findByClientIdPaginated y countByClientId
   */
  private buildClientOwnershipWhere(
    clientId: string,
    ownershipFilter?: { stylistId?: string; userId?: string },
  ): Prisma.AppointmentWhereInput {
    if (!ownershipFilter) {
      return { clientId };
    }

    const or: Prisma.AppointmentWhereInput[] = [];
    if (ownershipFilter.stylistId) {
      or.push({ stylistId: ownershipFilter.stylistId });
    }
    if (ownershipFilter.userId) {
      or.push({ userId: ownershipFilter.userId });
    }

    if (or.length === 0) {
      // Se pasó un ownershipFilter pero sin ningún campo útil: fallar cerrado
      // (0 resultados) en vez de degradar silenciosamente a "sin filtro", que
      // expondría todas las citas del cliente a un requester que debía estar
      // restringido (auditoría F17)
      return { clientId, id: NO_OWNERSHIP_MATCH_ID };
    }

    return { clientId, OR: or };
  }

  /**
   * Busca citas de un estilista de forma paginada, aplicando el ownershipFilter
   * directamente en el WHERE (no en memoria -- ver F17/F3)
   * @param stylistId - ID único del estilista
   * @param limit - Cantidad máxima de resultados
   * @param offset - Cantidad de resultados a saltar
   * @param ownershipFilter - Restricción adicional (OR) cuando el requester
   * es un CLIENT que solo puede ver las citas donde es el cliente o el
   * creador
   * @returns Promise que resuelve con la página de citas del estilista
   */
  async findByStylistIdPaginated(
    stylistId: string,
    limit: number,
    offset: number,
    ownershipFilter?: { userId?: string; clientId?: string },
  ): Promise<Appointment[]> {
    const where = this.buildStylistOwnershipWhere(stylistId, ownershipFilter);

    const appointmentsData = await this.prisma.appointment.findMany({
      where,
      include: {
        services: true,
      },
      orderBy: { dateTime: 'desc' },
      skip: offset,
      take: limit,
    });

    return appointmentsData.map((data) => this.mapToEntity(data));
  }

  /**
   * Cuenta las citas de un estilista aplicando el mismo ownershipFilter que
   * findByStylistIdPaginated, para que total/totalPages reflejen el filtro
   * real y no el total sin filtrar (ver F17/F3)
   */
  async countByStylistId(
    stylistId: string,
    ownershipFilter?: { userId?: string; clientId?: string },
  ): Promise<number> {
    const where = this.buildStylistOwnershipWhere(stylistId, ownershipFilter);
    return this.prisma.appointment.count({ where });
  }

  /**
   * Construye el WHERE compartido entre findByStylistIdPaginated y countByStylistId
   */
  private buildStylistOwnershipWhere(
    stylistId: string,
    ownershipFilter?: { userId?: string; clientId?: string },
  ): Prisma.AppointmentWhereInput {
    if (!ownershipFilter) {
      return { stylistId };
    }

    const or: Prisma.AppointmentWhereInput[] = [];
    if (ownershipFilter.userId) {
      or.push({ userId: ownershipFilter.userId });
    }
    if (ownershipFilter.clientId) {
      or.push({ clientId: ownershipFilter.clientId });
    }

    if (or.length === 0) {
      // Se pasó un ownershipFilter pero sin ningún campo útil: fallar cerrado
      // (0 resultados) en vez de degradar silenciosamente a "sin filtro", que
      // expondría todas las citas del estilista a un requester que debía estar
      // restringido (auditoría F17)
      return { stylistId, id: NO_OWNERSHIP_MATCH_ID };
    }

    return { stylistId, OR: or };
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

    const whereClause: Prisma.AppointmentWhereInput = {
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
   * Verifica si existe cualquier cita (activa o histórica) asociada a un servicio
   * @param serviceId - ID del servicio a verificar
   * @returns Promise que resuelve con true si existe al menos una cita asociada
   * @description Sin filtro de status: a diferencia de una validación de "citas activas",
   * esto también detecta citas COMPLETADAS o CANCELADAS, ya que el hard-delete de un
   * Service borra en cascada la relación M2M _AppointmentToService y destruiría el
   * registro histórico de servicios de esas citas (ver F8)
   */
  async existsByServiceId(serviceId: string): Promise<boolean> {
    const count = await this.prisma.appointment.count({
      where: {
        services: {
          some: { id: serviceId },
        },
      },
    });
    return count > 0;
  }

  /**
   * Mapea datos de Prisma a entidad de dominio
   * @param appointmentData - Datos de la cita desde Prisma
   * @returns Entidad Appointment
   */
  private mapToEntity(appointmentData: AppointmentWithServices): Appointment {
    return Appointment.fromPersistence(
      appointmentData.id,
      appointmentData.dateTime,
      appointmentData.duration,
      appointmentData.userId,
      appointmentData.clientId,
      appointmentData.scheduleId,
      appointmentData.statusId,
      appointmentData.stylistId ?? undefined,
      appointmentData.confirmedAt ?? undefined,
      appointmentData.services?.map((service) => service.id) || [],
      appointmentData.createdAt,
      appointmentData.updatedAt,
      appointmentData.cancellationReason ?? undefined,
      appointmentData.cancelledBy ?? undefined,
      appointmentData.confirmationNotes ?? undefined,
    );
  }
}
