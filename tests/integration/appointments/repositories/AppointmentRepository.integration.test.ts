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
    // Appointment.clientId almacena User.id directamente
    testClientId = clientUserId;

    const stylistUser = await createTestUser('STYLIST');
    const stylistUserId = stylistUser.user?.id || stylistUser.id;
    // Appointment.stylistId almacena User.id directamente
    testStylistId = stylistUserId;

    // Obtener schedule y status del seed
    const schedule = await testPrisma.schedule.findFirst();
    if (!schedule) {
      throw new Error('No se encontró ningún schedule en el seed');
    }
    testScheduleId = schedule.id;

    const status = await testPrisma.appointmentStatus.findFirst({
      where: { name: 'PENDING' },
    });
    if (!status) {
      throw new Error('Status "PENDING" not found in seed data');
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

    // Regresión: Prisma devuelve `null` para confirmedAt cuando la cita no está confirmada,
    // no `undefined`. Appointment.isConfirmed() compara contra `undefined`, así que si
    // mapToEntity() no normaliza ese null, toda cita releída de la base aparece
    // incorrectamente como "ya confirmada" (rompe Confirm/Update en producción).
    it('should not appear as confirmed when re-read from persistence right after creation', async () => {
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
      expect(savedAppointment.isConfirmed()).toBe(false);

      const foundAppointment = await repository.findById(savedAppointment.id);

      expect(foundAppointment).toBeDefined();
      expect(foundAppointment!.confirmedAt).toBeUndefined();
      expect(foundAppointment!.isConfirmed()).toBe(false);
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

  describe('findByClientIdPaginated / countByClientId (F17)', () => {
    it('should paginate appointments for a client ordered by dateTime desc', async () => {
      const baseDate = new Date();
      baseDate.setDate(baseDate.getDate() + 7);

      for (let i = 0; i < 5; i++) {
        const dateTime = new Date(baseDate);
        dateTime.setHours(dateTime.getHours() + i);
        const appointment = Appointment.create(
          dateTime,
          60,
          testUserId,
          testClientId,
          testScheduleId,
          testStatusId,
          testStylistId,
          [],
        );
        await repository.save(appointment);
      }

      const page1 = await repository.findByClientIdPaginated(testClientId, 2, 0);
      const page2 = await repository.findByClientIdPaginated(testClientId, 2, 2);

      expect(page1).toHaveLength(2);
      expect(page2).toHaveLength(2);
      // Orden desc por dateTime: el primero de la página 1 debe ser el más reciente
      expect(page1[0].dateTime.getTime()).toBeGreaterThan(page1[1].dateTime.getTime());
      // No debe haber solapamiento entre páginas
      const page1Ids = page1.map((a) => a.id);
      const page2Ids = page2.map((a) => a.id);
      expect(page1Ids.some((id) => page2Ids.includes(id))).toBe(false);
    });

    it('should count all appointments for a client without ownership filter', async () => {
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

      const total = await repository.countByClientId(testClientId);
      expect(total).toBeGreaterThanOrEqual(1);
    });

    // Verifica que el ownershipFilter se aplique en el WHERE de la consulta (DB-level),
    // no filtrando en memoria después de traer todo (el bug que corrige F17, mismo patrón que F3)
    it('should apply the STYLIST ownership filter at the DB level, not in memory', async () => {
      const otherStylistUser = await createTestUser('STYLIST');
      const otherStylistId = otherStylistUser.user?.id || otherStylistUser.id;

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      // Cita asignada al testStylistId (debe aparecer con el filtro)
      const ownAppointment = Appointment.create(
        futureDate,
        60,
        testUserId,
        testClientId,
        testScheduleId,
        testStatusId,
        testStylistId,
        [],
      );
      await repository.save(ownAppointment);

      // Cita asignada a otro estilista (NO debe aparecer con el filtro)
      const otherDate = new Date(futureDate);
      otherDate.setHours(otherDate.getHours() + 1);
      const otherAppointment = Appointment.create(
        otherDate,
        60,
        testUserId,
        testClientId,
        testScheduleId,
        testStatusId,
        otherStylistId,
        [],
      );
      await repository.save(otherAppointment);

      const ownershipFilter = { stylistId: testStylistId, userId: testStylistId };

      const filteredAppointments = await repository.findByClientIdPaginated(
        testClientId,
        10,
        0,
        ownershipFilter,
      );
      const filteredTotal = await repository.countByClientId(testClientId, ownershipFilter);

      expect(filteredAppointments.some((a) => a.id === ownAppointment.id)).toBe(true);
      expect(filteredAppointments.some((a) => a.id === otherAppointment.id)).toBe(false);
      expect(filteredTotal).toBe(filteredAppointments.length);
    });
  });

  describe('findByStylistIdPaginated / countByStylistId (F17)', () => {
    it('should paginate appointments for a stylist ordered by dateTime desc', async () => {
      const baseDate = new Date();
      baseDate.setDate(baseDate.getDate() + 7);

      for (let i = 0; i < 5; i++) {
        const dateTime = new Date(baseDate);
        dateTime.setHours(dateTime.getHours() + i);
        const appointment = Appointment.create(
          dateTime,
          60,
          testUserId,
          testClientId,
          testScheduleId,
          testStatusId,
          testStylistId,
          [],
        );
        await repository.save(appointment);
      }

      const page1 = await repository.findByStylistIdPaginated(testStylistId, 2, 0);
      const page2 = await repository.findByStylistIdPaginated(testStylistId, 2, 2);

      expect(page1).toHaveLength(2);
      expect(page2).toHaveLength(2);
      expect(page1[0].dateTime.getTime()).toBeGreaterThan(page1[1].dateTime.getTime());
    });

    // Verifica que el ownershipFilter se aplique en el WHERE de la consulta (DB-level),
    // no filtrando en memoria después de traer todo (el bug que corrige F17, mismo patrón que F3)
    it('should apply the CLIENT ownership filter at the DB level, not in memory', async () => {
      const otherClientUser = await createTestUser('CLIENT');
      const otherClientId = otherClientUser.user?.id || otherClientUser.id;

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      // Cita del testClientId con el testStylistId (debe aparecer con el filtro)
      const ownAppointment = Appointment.create(
        futureDate,
        60,
        testUserId,
        testClientId,
        testScheduleId,
        testStatusId,
        testStylistId,
        [],
      );
      await repository.save(ownAppointment);

      // Cita de otro cliente con el mismo estilista (NO debe aparecer con el filtro)
      const otherDate = new Date(futureDate);
      otherDate.setHours(otherDate.getHours() + 1);
      const otherAppointment = Appointment.create(
        otherDate,
        60,
        testUserId,
        otherClientId,
        testScheduleId,
        testStatusId,
        testStylistId,
        [],
      );
      await repository.save(otherAppointment);

      const ownershipFilter = { userId: testClientId, clientId: testClientId };

      const filteredAppointments = await repository.findByStylistIdPaginated(
        testStylistId,
        10,
        0,
        ownershipFilter,
      );
      const filteredTotal = await repository.countByStylistId(testStylistId, ownershipFilter);

      expect(filteredAppointments.some((a) => a.id === ownAppointment.id)).toBe(true);
      expect(filteredAppointments.some((a) => a.id === otherAppointment.id)).toBe(false);
      expect(filteredTotal).toBe(filteredAppointments.length);
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
