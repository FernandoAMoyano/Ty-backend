import { PrismaAppointmentRepository } from '../../../../src/modules/appointments/infrastructure/persistence/PrismaAppointmentRepository';
import { Appointment } from '../../../../src/modules/appointments/domain/entities/Appointment';
import { testPrisma, cleanupTestUsers } from '../../../setup/database';
import { createTestUser } from '../../../setup/helpers';
import { generateUuid } from '../../../../src/shared/utils/uuid';

describe('AppointmentRepository Integration Tests', () => {
  let repository: PrismaAppointmentRepository;
  let testUserId: string;
  let testClientId: string;
  let testStylistId: string;
  let testScheduleId: string;
  let testStatusId: string;

  beforeAll(async () => {
    repository = new PrismaAppointmentRepository(testPrisma);

    // Crear usuarios de prueba
    const adminUser = await createTestUser('ADMIN');
    testUserId = adminUser.user?.id || adminUser.id;

    const clientUser = await createTestUser('CLIENT');
    const clientUserId = clientUser.user?.id || clientUser.id;
    
    // Crear el registro Client asociado al usuario
    const client = await testPrisma.client.create({
      data: {
        userId: clientUserId,
      },
    });
    testClientId = client.id;

    const stylistUser = await createTestUser('STYLIST');
    const stylistUserId = stylistUser.user?.id || stylistUser.id;
    
    // Crear el registro Stylist asociado al usuario
    const stylist = await testPrisma.stylist.create({
      data: {
        userId: stylistUserId,
      },
    });
    testStylistId = stylist.id;

    // Obtener schedule y status del seed
    const schedule = await testPrisma.schedule.findFirst();
    if (!schedule) {
      throw new Error('No se encontró ningún schedule en el seed');
    }
    testScheduleId = schedule.id;

    const status = await testPrisma.appointmentStatus.findFirst({
      where: { name: 'Pendiente' },
    });
    if (!status) {
      throw new Error('No se encontró el status "Pendiente" en el seed');
    }
    testStatusId = status.id;
  });

  afterAll(async () => {
    await cleanupTestUsers();
  });

  beforeEach(async () => {
    // Limpiar appointments de prueba antes de cada test
    await testPrisma.appointment.deleteMany({
      where: {
        OR: [{ userId: testUserId }, { clientId: testClientId }],
      },
    });
    
    // Limpiar appointments antiguos del seed (primero eliminar pagos relacionados)
    const oldAppointments = await testPrisma.appointment.findMany({
      where: {
        dateTime: {
          lt: new Date(), // Citas en el pasado
        },
      },
      select: { id: true },
    });
    
    if (oldAppointments.length > 0) {
      const oldAppointmentIds = oldAppointments.map(a => a.id);
      
      // Primero eliminar pagos relacionados
      await testPrisma.payment.deleteMany({
        where: {
          appointmentId: { in: oldAppointmentIds },
        },
      });
      
      // Luego eliminar los appointments
      await testPrisma.appointment.deleteMany({
        where: {
          id: { in: oldAppointmentIds },
        },
      });
    }
  });

  describe('save', () => {
    it('should save a new appointment successfully', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      const appointment = new Appointment(
        generateUuid(),
        futureDate,
        60,
        testUserId,
        testClientId,
        testScheduleId,
        testStatusId,
        testStylistId,
        undefined, // confirmedAt
        [], // serviceIds
        new Date(), // createdAt
        new Date(), // updatedAt
      );

      const savedAppointment = await repository.save(appointment);

      expect(savedAppointment.id).toBeDefined();
      expect(savedAppointment.dateTime).toEqual(futureDate);
      expect(savedAppointment.duration).toBe(60);
      expect(savedAppointment.userId).toBe(testUserId);
      expect(savedAppointment.clientId).toBe(testClientId);
      expect(savedAppointment.scheduleId).toBe(testScheduleId);
      expect(savedAppointment.statusId).toBe(testStatusId);
    });

    it('should generate ID automatically when using create method', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      const appointment = Appointment.create(
        futureDate,
        45,
        testUserId,
        testClientId,
        testScheduleId,
        testStatusId,
        undefined, // Sin estilista
        [], // serviceIds
      );

      const savedAppointment = await repository.save(appointment);

      expect(savedAppointment.id).toBeDefined();
      expect(savedAppointment.id).toMatch(/^[0-9a-f-]{36}$/); // UUID format
    });
  });

  describe('findById', () => {
    it('should find appointment by existing id', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      const appointment = Appointment.create(
        futureDate,
        60,
        testUserId,
        testClientId,
        testScheduleId,
        testStatusId,
        testStylistId,
        [], // serviceIds
      );

      const savedAppointment = await repository.save(appointment);
      const foundAppointment = await repository.findById(savedAppointment.id);

      expect(foundAppointment).toBeDefined();
      expect(foundAppointment!.id).toBe(savedAppointment.id);
      expect(foundAppointment!.duration).toBe(60);
      expect(foundAppointment!.userId).toBe(testUserId);
    });

    it('should return null for non-existing id', async () => {
      const nonExistingId = '00000000-0000-0000-0000-000000000000';
      const foundAppointment = await repository.findById(nonExistingId);
      expect(foundAppointment).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return empty array when no appointments exist', async () => {
      const appointments = await repository.findAll();
      const testAppointments = appointments.filter(
        (app) => app.userId === testUserId || app.clientId === testClientId,
      );
      expect(testAppointments).toEqual([]);
    });

    it('should return all existing appointments', async () => {
      const futureDate1 = new Date();
      futureDate1.setDate(futureDate1.getDate() + 7);

      const futureDate2 = new Date();
      futureDate2.setDate(futureDate2.getDate() + 8);

      const appointment1 = Appointment.create(
        futureDate1,
        60,
        testUserId,
        testClientId,
        testScheduleId,
        testStatusId,
        testStylistId,
        [],
      );

      const appointment2 = Appointment.create(
        futureDate2,
        90,
        testUserId,
        testClientId,
        testScheduleId,
        testStatusId,
        undefined,
        [],
      );

      await repository.save(appointment1);
      await repository.save(appointment2);

      const allAppointments = await repository.findAll();
      const testAppointments = allAppointments.filter((app) => app.userId === testUserId);

      expect(testAppointments).toHaveLength(2);
      expect(testAppointments.some((app) => app.duration === 60)).toBe(true);
      expect(testAppointments.some((app) => app.duration === 90)).toBe(true);
    });
  });

  describe('update', () => {
    it('should update existing appointment', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      const appointment = Appointment.create(
        futureDate,
        60,
        testUserId,
        testClientId,
        testScheduleId,
        testStatusId,
        testStylistId,
        [],
      );

      const savedAppointment = await repository.save(appointment);

      // Actualizar duración
      const updatedAppointment = new Appointment(
        savedAppointment.id,
        savedAppointment.dateTime,
        90, // Nueva duración
        savedAppointment.userId,
        savedAppointment.clientId,
        savedAppointment.scheduleId,
        savedAppointment.statusId,
        savedAppointment.stylistId,
        savedAppointment.confirmedAt,
        savedAppointment.serviceIds,
        savedAppointment.createdAt,
        new Date(),
      );

      const result = await repository.update(updatedAppointment);

      expect(result.duration).toBe(90);
      expect(result.id).toBe(savedAppointment.id);
      expect(result.updatedAt.getTime()).toBeGreaterThan(savedAppointment.updatedAt.getTime());
    });

    it('should throw error for non-existing id', async () => {
      const nonExistingId = '00000000-0000-0000-0000-000000000000';
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      const appointment = new Appointment(
        nonExistingId,
        futureDate,
        60,
        testUserId,
        testClientId,
        testScheduleId,
        testStatusId,
        testStylistId,
        undefined,
        [],
        new Date(),
        new Date(),
      );

      await expect(repository.update(appointment)).rejects.toThrow();
    });
  });

  describe('delete', () => {
    it('should delete existing appointment', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      const appointment = Appointment.create(
        futureDate,
        60,
        testUserId,
        testClientId,
        testScheduleId,
        testStatusId,
        testStylistId,
        [],
      );

      const savedAppointment = await repository.save(appointment);
      await repository.delete(savedAppointment.id);

      const foundAppointment = await repository.findById(savedAppointment.id);
      expect(foundAppointment).toBeNull();
    });

    it('should throw error when deleting non-existing appointment', async () => {
      const nonExistingId = '00000000-0000-0000-0000-000000000000';
      await expect(repository.delete(nonExistingId)).rejects.toThrow();
    });
  });

  describe('existsById', () => {
    it('should return true for existing id', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      const appointment = Appointment.create(
        futureDate,
        60,
        testUserId,
        testClientId,
        testScheduleId,
        testStatusId,
        testStylistId,
        [],
      );

      const savedAppointment = await repository.save(appointment);
      const exists = await repository.existsById(savedAppointment.id);
      expect(exists).toBe(true);
    });

    it('should return false for non-existing id', async () => {
      const nonExistingId = '00000000-0000-0000-0000-000000000000';
      const exists = await repository.existsById(nonExistingId);
      expect(exists).toBe(false);
    });
  });

  describe('findByClientId', () => {
    it('should return appointments for specific client', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      const appointment = Appointment.create(
        futureDate,
        60,
        testUserId,
        testClientId,
        testScheduleId,
        testStatusId,
        testStylistId,
        [],
      );

      await repository.save(appointment);

      const clientAppointments = await repository.findByClientId(testClientId);

      expect(clientAppointments.length).toBeGreaterThanOrEqual(1);
      expect(clientAppointments.every((app) => app.clientId === testClientId)).toBe(true);
    });

    it('should return empty array for client with no appointments', async () => {
      const nonExistingClientId = '00000000-0000-0000-0000-000000000000';
      const clientAppointments = await repository.findByClientId(nonExistingClientId);
      expect(clientAppointments).toEqual([]);
    });
  });

  describe('findConflictingAppointments', () => {
    it('should find conflicting appointments', async () => {
      const conflictDate = new Date();
      conflictDate.setDate(conflictDate.getDate() + 7);
      conflictDate.setHours(10, 0, 0, 0);

      // Crear cita existente
      const existingAppointment = Appointment.create(
        conflictDate,
        60, // 10:00 - 11:00
        testUserId,
        testClientId,
        testScheduleId,
        testStatusId,
        testStylistId,
        [],
      );

      await repository.save(existingAppointment);

      // Buscar conflictos para nueva cita
      const newAppointmentDate = new Date(conflictDate);
      newAppointmentDate.setMinutes(30); // 10:30 - 11:30

      const conflicts = await repository.findConflictingAppointments(
        newAppointmentDate,
        60,
        testStylistId,
      );

      expect(conflicts.length).toBeGreaterThanOrEqual(1);
      expect(conflicts.some((app) => app.id === existingAppointment.id)).toBe(true);
    });

    it('should not find conflicts for different stylists', async () => {
      const conflictDate = new Date();
      conflictDate.setDate(conflictDate.getDate() + 7);
      conflictDate.setHours(14, 0, 0, 0);

      // Crear cita con stylist1
      const appointment = Appointment.create(
        conflictDate,
        60,
        testUserId,
        testClientId,
        testScheduleId,
        testStatusId,
        testStylistId,
        [],
      );

      await repository.save(appointment);

      // Buscar conflictos para otro stylist (string diferente)
      const conflicts = await repository.findConflictingAppointments(
        conflictDate,
        60,
        'different-stylist-id',
      );

      expect(conflicts).toEqual([]);
    });
  });
});
