import request from 'supertest';
import app from '../../src/app';
import { testPrisma } from '../setup/database';
import { loginAsAdmin, createTestUser } from '../setup/helpers';
import {
  createTestAppointment,
  cleanupTestAppointments,
  createTestSchedule,
} from '../setup/appointments-helpers';
import { DayOfWeek } from '@prisma/client';

/**
 * Genera un UUID v4 simple para tests
 */
const generateTestUuid = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

describe('Appointments Complete Flow E2E Tests', () => {
  let adminToken: string;
  let clientToken: string;

  // Utilidades de fecha dinámicas
  const getFutureDateString = (daysFromNow: number = 7): string => {
    const future = new Date();
    future.setDate(future.getDate() + daysFromNow);
    return future.toISOString().split('T')[0];
  };

  // Helper para obtener el día de la semana
  const getDayOfWeekFromDate = (daysFromNow: number): DayOfWeek => {
    const dayNames: DayOfWeek[] = [
      DayOfWeek.SUNDAY,
      DayOfWeek.MONDAY,
      DayOfWeek.TUESDAY,
      DayOfWeek.WEDNESDAY,
      DayOfWeek.THURSDAY,
      DayOfWeek.FRIDAY,
      DayOfWeek.SATURDAY,
    ];
    const future = new Date();
    future.setDate(future.getDate() + daysFromNow);
    return dayNames[future.getDay()];
  };

  beforeAll(async () => {
    // 1. Login como admin
    adminToken = await loginAsAdmin();

    // 2. Crear usuario cliente para tests
    const clientUser = await createTestUser('CLIENT');

    // 3. Obtener token del cliente
    const clientLoginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: clientUser.user?.email || clientUser.email,
        password: 'TestPass123!',
      });
    clientToken = clientLoginResponse.body.data.token;
  });

  afterAll(async () => {
    await cleanupTestAppointments();
  });

  describe('Available Slots Flow (Public Endpoint)', () => {
    // Debería completar el flujo de consulta de slots disponibles
    it('should complete available slots query flow', async () => {
      // 1. Preparar fecha y día de la semana
      const daysFromNow = 7;
      const dayOfWeek = getDayOfWeekFromDate(daysFromNow);

      // 2. Verificar o crear schedule para ese día
      let schedule = await testPrisma.schedule.findFirst({
        where: { dayOfWeek },
      });

      if (!schedule) {
        schedule = await createTestSchedule(dayOfWeek, '09:00', '18:00');
      }

      // 3. Consultar slots disponibles
      const dateString = getFutureDateString(daysFromNow);
      const response = await request(app)
        .get('/api/v1/appointments/available-slots')
        .query({ date: dateString })
        .expect(200);

      // 4. Verificar respuesta
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('date', dateString);
      expect(response.body.data).toHaveProperty('dayOfWeek');
      expect(response.body.data).toHaveProperty('isWorkingDay');
      expect(response.body.data).toHaveProperty('slots');
    });

    // Debería retornar día no laboral cuando no hay schedule
    it('should return non-working day when no schedule exists', async () => {
      // 1. Buscar días con schedule existente
      const allSchedules = await testPrisma.schedule.findMany();
      const scheduledDays = allSchedules.map((s) => s.dayOfWeek);

      // 2. Encontrar un día futuro sin schedule
      let daysFromNow = 1;
      let targetDay = getDayOfWeekFromDate(daysFromNow);

      while (scheduledDays.includes(targetDay) && daysFromNow < 14) {
        daysFromNow++;
        targetDay = getDayOfWeekFromDate(daysFromNow);
      }

      // 3. Si todos los días tienen schedule, usar domingo como test
      if (scheduledDays.includes(targetDay)) {
        const sundaySchedule = await testPrisma.schedule.findFirst({
          where: { dayOfWeek: DayOfWeek.SUNDAY },
        });

        if (sundaySchedule) {
          // 3a. Eliminar temporalmente schedule de domingo
          await testPrisma.schedule.delete({ where: { id: sundaySchedule.id } });
        }

        // 3b. Calcular próximo domingo
        let sundayDaysFromNow = 1;
        while (getDayOfWeekFromDate(sundayDaysFromNow) !== DayOfWeek.SUNDAY) {
          sundayDaysFromNow++;
        }

        // 4. Consultar slots para día sin schedule
        const dateString = getFutureDateString(sundayDaysFromNow);
        const response = await request(app)
          .get('/api/v1/appointments/available-slots')
          .query({ date: dateString })
          .expect(200);

        // 5. Verificar que es día no laboral
        expect(response.body.success).toBe(true);
        expect(response.body.data.isWorkingDay).toBe(false);
        expect(response.body.data.slots).toEqual([]);

        // 6. Restaurar schedule si existía
        if (sundaySchedule) {
          await testPrisma.schedule.create({
            data: {
              dayOfWeek: DayOfWeek.SUNDAY,
              startTime: sundaySchedule.startTime,
              endTime: sundaySchedule.endTime,
            },
          });
        }
      }
    });

    // Debería manejar validaciones de fecha
    it('should handle date validations', async () => {
      // 1. Rechazar fecha en formato inválido
      const invalidFormatResponse = await request(app)
        .get('/api/v1/appointments/available-slots')
        .query({ date: '01-15-2025' })
        .expect(400);

      expect(invalidFormatResponse.body.success).toBe(false);

      // 2. Rechazar fecha en el pasado
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 5);
      const pastDateString = pastDate.toISOString().split('T')[0];

      const pastDateResponse = await request(app)
        .get('/api/v1/appointments/available-slots')
        .query({ date: pastDateString })
        .expect(400);

      expect(pastDateResponse.body.success).toBe(false);

      // 3. Rechazar fecha vacía
      const emptyDateResponse = await request(app)
        .get('/api/v1/appointments/available-slots')
        .query({ date: '' })
        .expect(400);

      expect(emptyDateResponse.body.success).toBe(false);
    });

    // Debería aceptar parámetros opcionales válidos
    it('should accept valid optional parameters', async () => {
      // 1. Preparar fecha con schedule válido
      const daysFromNow = 7;
      const dayOfWeek = getDayOfWeekFromDate(daysFromNow);

      let schedule = await testPrisma.schedule.findFirst({
        where: { dayOfWeek },
      });

      if (!schedule) {
        schedule = await createTestSchedule(dayOfWeek, '09:00', '18:00');
      }

      // 2. Consultar con duración específica
      const dateString = getFutureDateString(daysFromNow);
      const response = await request(app)
        .get('/api/v1/appointments/available-slots')
        .query({ date: dateString, duration: '60' })
        .expect(200);

      // 3. Verificar respuesta
      expect(response.body.success).toBe(true);

      if (response.body.data.isWorkingDay && response.body.data.slots.length > 0) {
        expect(response.body.data.slots[0].duration).toBe(60);
      }
    });
  });

  describe('Appointment Query Operations', () => {
    let testAppointment: any;

    beforeAll(async () => {
      testAppointment = await createTestAppointment();
    });

    // Debería completar el flujo de consulta de cita por ID
    it('should complete appointment query by ID flow', async () => {
      // 1. Consultar cita existente
      const response = await request(app)
        .get(`/api/v1/appointments/${testAppointment.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // 2. Verificar datos de la cita
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testAppointment.id);
      expect(response.body.data).toHaveProperty('dateTime');
      expect(response.body.data).toHaveProperty('duration');
    });

    // Debería manejar errores de consulta por ID
    it('should handle query by ID errors', async () => {
      // 1. Consultar cita inexistente - esperar 404
      const nonExistentId = generateTestUuid();
      const notFoundResponse = await request(app)
        .get(`/api/v1/appointments/${nonExistentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(notFoundResponse.body.success).toBe(false);

      // 2. Consultar con UUID inválido - esperar 400
      const invalidUuidResponse = await request(app)
        .get('/api/v1/appointments/invalid-uuid-format')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);

      expect(invalidUuidResponse.body.success).toBe(false);
    });

    // Debería consultar citas por cliente
    it('should query appointments by client', async () => {
      // 1. Consultar citas del cliente
      const response = await request(app)
        .get(`/api/v1/appointments/client/${testAppointment.clientId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // 2. Verificar respuesta es un array
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    // Debería consultar citas por estilista
    it('should query appointments by stylist', async () => {
      // Solo ejecutar si el appointment tiene stylistId
      if (testAppointment.stylistId) {
        // 1. Consultar citas del estilista
        const response = await request(app)
          .get(`/api/v1/appointments/stylist/${testAppointment.stylistId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        // 2. Verificar respuesta es un array
        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data)).toBe(true);
      }
    });
  });

  describe('Authentication & Authorization', () => {
    let testAppointment: any;

    beforeAll(async () => {
      testAppointment = await createTestAppointment();
    });

    // Debería validar autenticación en rutas protegidas
    it('should validate authentication on protected routes', async () => {
      // 1. Intentar acceso sin token - esperar 401
      const noTokenResponse = await request(app)
        .get(`/api/v1/appointments/${testAppointment.id}`)
        .expect(401);

      expect(noTokenResponse.body.success).toBe(false);

      // 2. Intentar acceso con token inválido - esperar 401
      const invalidTokenResponse = await request(app)
        .get(`/api/v1/appointments/${testAppointment.id}`)
        .set('Authorization', 'Bearer invalid-token-here')
        .expect(401);

      expect(invalidTokenResponse.body.success).toBe(false);
    });

    // Debería permitir acceso público a endpoints públicos
    it('should allow public access to public endpoints', async () => {
      // 1. Consultar available-slots sin autenticación
      const dateString = getFutureDateString(7);
      const response = await request(app)
        .get('/api/v1/appointments/available-slots')
        .query({ date: dateString });

      // 2. Verificar que no rechaza por autenticación
      expect(response.status).not.toBe(401);
    });
  });

  describe('Input Validation', () => {
    // Debería validar datos de entrada al crear cita
    it('should validate appointment creation input', async () => {
      // 1. Enviar datos inválidos
      const invalidData = {
        dateTime: '',
        clientId: '',
        serviceIds: [],
      };

      // 2. Verificar rechazo con 400
      const response = await request(app)
        .post('/api/v1/appointments')
        .set('Authorization', `Bearer ${clientToken}`)
        .send(invalidData)
        .expect(400);

      // 3. Verificar respuesta de error
      expect(response.body.success).toBe(false);
    });
  });

  describe('Statistics Endpoint', () => {
    // Debería retornar estadísticas del sistema
    it('should return system statistics', async () => {
      // 1. Consultar estadísticas como admin
      const response = await request(app)
        .get('/api/v1/appointments/statistics')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // 2. Verificar respuesta exitosa
      expect(response.body.success).toBe(true);
    });
  });
});
