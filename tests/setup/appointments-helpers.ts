import { testPrisma } from './database';
import { createTestUser } from './helpers';
import { generateUuid } from '../../src/shared/utils/uuid';
import { DayOfWeek } from '@prisma/client';

/**
 * Interfaz para los datos del seed que retorna getSeedData
 */
interface SeedData {
  statuses: {
    pending: any | null;
    confirmed: any | null;
    completed: any | null;
  };
  schedules: {
    monday: any | null;
  };
}

/**
 * Obtiene o crea los datos base necesarios para appointments
 * Crea usuarios de prueba y obtiene/crea schedule y status requeridos
 * @returns Promise que resuelve con IDs de entidades base necesarias
 * @private
 */
async function getOrCreateBaseData() {
  // Crear usuarios de prueba
  const adminUser = await createTestUser('ADMIN');
  const clientUser = await createTestUser('CLIENT');
  const stylistUser = await createTestUser('STYLIST');

  const userId = adminUser.user?.id || adminUser.id;
  const clientUserId = clientUser.user?.id || clientUser.id;
  const stylistUserId = stylistUser.user?.id || stylistUser.id;

  // Obtener o crear Client asociado al User
  let client = await testPrisma.client.findFirst({
    where: { userId: clientUserId },
  });

  if (!client) {
    client = await testPrisma.client.create({
      data: {
        userId: clientUserId,
      },
    });
  }

  // Obtener o crear Stylist asociado al User
  let stylist = await testPrisma.stylist.findFirst({
    where: { userId: stylistUserId },
  });

  if (!stylist) {
    stylist = await testPrisma.stylist.create({
      data: {
        userId: stylistUserId,
      },
    });
  }

  // Obtener o crear schedule
  let schedule = await testPrisma.schedule.findFirst();

  if (!schedule) {
    schedule = await testPrisma.schedule.create({
      data: {
        id: generateUuid(),
        dayOfWeek: DayOfWeek.MONDAY,
        startTime: '09:00',
        endTime: '18:00',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
  }

  // Obtener o crear status
  let status = await testPrisma.appointmentStatus.findFirst({
    where: { name: 'Pendiente' }
  });

  if (!status) {
    status = await testPrisma.appointmentStatus.create({
      data: {
        id: generateUuid(),
        name: 'Pendiente',
        description: 'Appointment pending confirmation'
      }
    });
  }

  return {
    userId,
    clientId: client.id,  // Ahora usa Client.id correcto
    stylistId: stylist.id, // Ahora usa Stylist.id correcto
    scheduleId: schedule.id,
    statusId: status.id
  };
}

/**
 * Crea un appointment de prueba con datos válidos para testing
 * @param overrides - Propiedades opcionales para sobrescribir los valores por defecto
 * @returns Promise que resuelve con el appointment creado en la base de datos
 * @example
 * ```typescript
 * const appointment = await createTestAppointment({ duration: 90 });
 * ```
 */
export async function createTestAppointment(overrides: Partial<any> = {}): Promise<any> {
  // Obtener o crear datos base necesarios
  const { userId, clientId, stylistId, scheduleId, statusId } = await getOrCreateBaseData();
  
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 7);
  futureDate.setHours(10, 0, 0, 0);

  const appointmentData = {
    id: generateUuid(),
    dateTime: futureDate,
    duration: 60,
    userId,
    clientId,
    scheduleId,
    statusId,
    stylistId: stylistId,
    confirmedAt: null,
    serviceIds: [], // Simplificado para tests
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  };

  const createdAppointment = await testPrisma.appointment.create({
    data: {
      id: appointmentData.id,
      dateTime: appointmentData.dateTime,
      duration: appointmentData.duration,
      userId: appointmentData.userId,
      clientId: appointmentData.clientId,
      scheduleId: appointmentData.scheduleId,
      statusId: appointmentData.statusId,
      stylistId: appointmentData.stylistId,
      confirmedAt: appointmentData.confirmedAt,
      createdAt: appointmentData.createdAt,
      updatedAt: appointmentData.updatedAt
    }
  });

  return createdAppointment;
}

/**
 * Crea un appointment status de prueba
 * @param name - Nombre del status (debe comenzar con 'TEST_' para fácil limpieza)
 * @param description - Descripción del status
 * @returns Promise que resuelve con el appointment status creado
 * @example
 * ```typescript
 * const status = await createTestAppointmentStatus('TEST_CUSTOM', 'Custom test status');
 * ```
 */
export async function createTestAppointmentStatus(
  name: string = 'TEST_STATUS', 
  description: string = 'Status for testing'
): Promise<any> {
  const statusData = {
    id: generateUuid(),
    name,
    description
  };

  const createdStatus = await testPrisma.appointmentStatus.create({
    data: statusData
  });

  return createdStatus;
}

/**
 * Crea un schedule de prueba
 * @param dayOfWeek - Día de la semana usando el enum DayOfWeek de Prisma
 * @param startTime - Hora de inicio en formato HH:MM
 * @param endTime - Hora de fin en formato HH:MM
 * @returns Promise que resuelve con el schedule creado
 * @example
 * ```typescript
 * const schedule = await createTestSchedule(DayOfWeek.SATURDAY, '10:00', '20:00');
 * ```
 */
export async function createTestSchedule(
  dayOfWeek: DayOfWeek = DayOfWeek.MONDAY, 
  startTime: string = '09:00', 
  endTime: string = '18:00'
): Promise<any> {
  const scheduleData = {
    id: generateUuid(),
    dayOfWeek,
    startTime,
    endTime,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const createdSchedule = await testPrisma.schedule.create({
    data: scheduleData
  });

  return createdSchedule;
}

/**
 * Limpia todos los appointments de prueba de la base de datos
 * Elimina solo appointments asociados a usuarios con 'test' en el email
 * @returns Promise que resuelve cuando la limpieza está completa
 * @example
 * ```typescript
 * await cleanupTestAppointments();
 * ```
 */
export async function cleanupTestAppointments(): Promise<void> {
  // Obtener IDs de usuarios de prueba primero
  const testUsers = await testPrisma.user.findMany({
    where: {
      email: { contains: 'test' }
    },
    select: { id: true }
  });

  const testUserIds = testUsers.map(user => user.id);

  if (testUserIds.length > 0) {
    // Obtener Client IDs asociados a los usuarios de prueba
    const testClients = await testPrisma.client.findMany({
      where: {
        userId: { in: testUserIds }
      },
      select: { id: true }
    });

    const testClientIds = testClients.map(client => client.id);

    // Eliminar appointments por userId o clientId correcto
    await testPrisma.appointment.deleteMany({
      where: {
        OR: [
          { userId: { in: testUserIds } },
          { clientId: { in: testClientIds } }
        ]
      }
    });
  }
}

/**
 * Limpia todos los appointment statuses de prueba
 * Elimina solo statuses que comiencen con 'TEST_'
 * @returns Promise que resuelve cuando la limpieza está completa
 * @example
 * ```typescript
 * await cleanupTestAppointmentStatuses();
 * ```
 */
export async function cleanupTestAppointmentStatuses(): Promise<void> {
  await testPrisma.appointmentStatus.deleteMany({
    where: {
      name: { startsWith: 'TEST_' }
    }
  });
}

/**
 * Limpia schedules de prueba usando estrategia que preserva datos del seed
 * @returns Promise que resuelve cuando la limpieza está completa
 * @example
 * ```typescript
 * await cleanupTestSchedules();
 * ```
 */
export async function cleanupTestSchedules(): Promise<void> {
  // Eliminar schedules de fines de semana que probablemente son de tests
  const seedDays = [DayOfWeek.MONDAY, DayOfWeek.TUESDAY, DayOfWeek.WEDNESDAY, DayOfWeek.THURSDAY, DayOfWeek.FRIDAY];
  
  await testPrisma.schedule.deleteMany({
    where: {
      OR: [
        {
          AND: [
            { dayOfWeek: { in: seedDays } },
            { NOT: { startTime: '09:00' } }
          ]
        },
        {
          AND: [
            { dayOfWeek: { in: seedDays } },
            { NOT: { endTime: '18:00' } }
          ]
        }
      ]
    }
  });
}

/**
 * Limpia todos los datos de prueba de appointments
 * Ejecuta limpieza de appointments, appointment statuses y schedules de prueba
 * @returns Promise que resuelve cuando toda la limpieza está completa
 */
export async function cleanupAll(): Promise<void> {
  await cleanupTestAppointments();
  await cleanupTestAppointmentStatuses();
  await cleanupTestSchedules();
}

/**
 * Obtiene datos del seed para usar en tests
 * @returns Promise que resuelve con objetos de datos del seed
 * @example
 * ```typescript
 * const seedData = await getSeedData();
 * const pendingStatus = seedData.statuses.pending;
 * ```
 */
export async function getSeedData(): Promise<SeedData> {
  const pendingStatus = await testPrisma.appointmentStatus.findFirst({
    where: { name: 'Pendiente' }
  });

  const confirmedStatus = await testPrisma.appointmentStatus.findFirst({
    where: { name: 'Confirmada' }
  });

  const completedStatus = await testPrisma.appointmentStatus.findFirst({
    where: { name: 'Completada' }
  });

  const mondaySchedule = await testPrisma.schedule.findFirst({
    where: { dayOfWeek: DayOfWeek.MONDAY }
  });

  return {
    statuses: {
      pending: pendingStatus,
      confirmed: confirmedStatus,
      completed: completedStatus
    },
    schedules: {
      monday: mondaySchedule
    }
  };
}

/**
 * Crea un appointment en una fecha y hora específica para pruebas de conflictos
 * @param dateTime - Fecha y hora específica del appointment
 * @param duration - Duración en minutos (por defecto 60)
 * @param stylistId - ID del stylist opcional
 * @returns Promise que resuelve con el appointment creado
 * @example
 * ```typescript
 * const conflictDate = new Date('2025-12-25T10:00:00.000Z');
 * const appointment = await createAppointmentAtDateTime(conflictDate, 90, stylistId);
 * ```
 */
export async function createAppointmentAtDateTime(
  dateTime: Date, 
  duration: number = 60, 
  stylistId?: string
): Promise<any> {
  const { userId, clientId, scheduleId, statusId } = await getOrCreateBaseData();

  return await testPrisma.appointment.create({
    data: {
      id: generateUuid(),
      dateTime,
      duration,
      userId,
      clientId: clientId,
      scheduleId,
      statusId,
      stylistId: stylistId || null,
      confirmedAt: null,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  });
}

/**
 * Crea múltiples appointments para un cliente específico en fechas diferentes
 * @param clientId - ID del cliente para quien crear los appointments
 * @param count - Número de appointments a crear (por defecto 3)
 * @returns Promise que resuelve con array de appointments creados
 * @example
 * ```typescript
 * const appointments = await createMultipleAppointmentsForClient(clientId, 5);
 * expect(appointments).toHaveLength(5);
 * ```
 */
export async function createMultipleAppointmentsForClient(
  clientId: string, 
  count: number = 3
): Promise<any[]> {
  const { userId, scheduleId, statusId } = await getOrCreateBaseData();
  const appointments = [];

  for (let i = 0; i < count; i++) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + (i + 1) * 7); // Cada semana
    futureDate.setHours(10 + i, 0, 0, 0); // Diferentes horas

    const appointment = await testPrisma.appointment.create({
      data: {
        id: generateUuid(),
        dateTime: futureDate,
        duration: 60,
        userId,
        clientId,
        scheduleId,
        statusId,
        stylistId: null,
        confirmedAt: null,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    appointments.push(appointment);
  }

  return appointments;
}
