import request from 'supertest';
import app from '../../../src/app';
import { loginAsAdmin, loginTestUser } from '../../setup/helpers';
import { testPrisma } from '../../setup/database';

// Tests de integración para el módulo de Feriados
describe('Holidays Integration Tests', () => {
  let adminToken: string;
  let userToken: string;
  let testHolidayId: string;
  let testExceptionId: string;

  beforeAll(async () => {
    // Login como admin
    adminToken = await loginAsAdmin();

    // Login como usuario normal (cliente)
    const userData = await loginTestUser();
    userToken = userData.token;

    // Limpiar feriados de prueba anteriores
    await testPrisma.scheduleException.deleteMany({
      where: {
        reason: {
          contains: 'TEST',
        },
      },
    });
    await testPrisma.holiday.deleteMany({
      where: {
        name: {
          contains: 'TEST',
        },
      },
    });
  });

  afterAll(async () => {
    // Limpiar datos de prueba
    await testPrisma.scheduleException.deleteMany({
      where: {
        reason: {
          contains: 'TEST',
        },
      },
    });
    await testPrisma.holiday.deleteMany({
      where: {
        name: {
          contains: 'TEST',
        },
      },
    });
  });

  // ==========================================
  // HOLIDAY ROUTES
  // ==========================================

  // POST /api/v1/holidays - Crear feriado (Admin only)
  describe('POST /api/v1/holidays - Create Holiday', () => {
    // Debería crear un feriado como admin
    it('should create a holiday as admin', async () => {
      const response = await request(app)
        .post('/api/v1/holidays')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'TEST Navidad',
          date: '2099-12-25',
          description: 'TEST Día de Navidad',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.name).toBe('TEST Navidad');
      expect(response.body.data.description).toBe('TEST Día de Navidad');

      testHolidayId = response.body.data.id;
    });

    // Debería crear un feriado sin descripción
    it('should create a holiday without description', async () => {
      const response = await request(app)
        .post('/api/v1/holidays')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'TEST Año Nuevo',
          date: '2099-01-01',
        });

      expect(response.status).toBe(201);
      expect(response.body.data.description).toBeNull();
    });

    // Debería rechazar creación como cliente
    it('should reject creation as client', async () => {
      const response = await request(app)
        .post('/api/v1/holidays')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'TEST Feriado',
          date: '2099-07-09',
        });

      expect(response.status).toBe(403);
    });

    // Debería rechazar creación sin autenticación
    it('should reject creation without authentication', async () => {
      const response = await request(app).post('/api/v1/holidays').send({
        name: 'TEST Feriado',
        date: '2099-07-04',
      });

      expect(response.status).toBe(401);
    });

    // Debería rechazar feriado duplicado en la misma fecha
    it('should reject duplicate holiday on same date', async () => {
      const response = await request(app)
        .post('/api/v1/holidays')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'TEST Duplicado',
          date: '2099-12-25',
        });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
    });

    // Debería validar nombre requerido
    it('should validate name is required', async () => {
      const response = await request(app)
        .post('/api/v1/holidays')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          date: '2099-08-15',
        });

      expect(response.status).toBe(400);
    });

    // Debería validar fecha requerida
    it('should validate date is required', async () => {
      const response = await request(app)
        .post('/api/v1/holidays')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'TEST Sin Fecha',
        });

      expect(response.status).toBe(400);
    });
  });

  // GET /api/v1/holidays - Listar feriados (Público)
  describe('GET /api/v1/holidays - List Holidays', () => {
    // Debería listar feriados sin autenticación
    it('should list holidays without authentication', async () => {
      const response = await request(app).get('/api/v1/holidays');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('holidays');
      expect(response.body.data).toHaveProperty('total');
      expect(response.body.data).toHaveProperty('page');
    });

    // Debería filtrar por año
    it('should filter by year', async () => {
      const response = await request(app).get('/api/v1/holidays?year=2099');

      expect(response.status).toBe(200);
      expect(response.body.data.holidays.length).toBeGreaterThanOrEqual(1);
    });

    // Debería filtrar por nombre
    it('should filter by name', async () => {
      const response = await request(app).get('/api/v1/holidays?name=Navidad');

      expect(response.status).toBe(200);
    });

    // Debería paginar correctamente
    it('should paginate correctly', async () => {
      const response = await request(app).get('/api/v1/holidays?page=1&limit=5');

      expect(response.status).toBe(200);
      expect(response.body.data.page).toBe(1);
      expect(response.body.data.limit).toBe(5);
    });
  });

  // GET /api/v1/holidays/:id - Obtener feriado por ID (Público)
  describe('GET /api/v1/holidays/:id - Get Holiday by ID', () => {
    // Debería obtener un feriado por ID
    it('should get a holiday by ID', async () => {
      const response = await request(app).get(`/api/v1/holidays/${testHolidayId}`);

      expect(response.status).toBe(200);
      expect(response.body.data.id).toBe(testHolidayId);
      expect(response.body.data.name).toBe('TEST Navidad');
    });

    // Debería retornar 404 si no existe
    it('should return 404 if not found', async () => {
      const response = await request(app).get(
        '/api/v1/holidays/00000000-0000-4000-8000-000000000000',
      );

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    // Debería validar UUID inválido
    it('should validate invalid UUID', async () => {
      const response = await request(app).get('/api/v1/holidays/invalid-uuid');

      expect(response.status).toBe(400);
    });
  });

  // GET /api/v1/holidays/upcoming - Próximos feriados (Público)
  describe('GET /api/v1/holidays/upcoming - Upcoming Holidays', () => {
    // Debería obtener próximos feriados
    it('should get upcoming holidays', async () => {
      const response = await request(app).get('/api/v1/holidays/upcoming');

      expect(response.status).toBe(200);
      expect(response.body.data).toBeInstanceOf(Array);
    });

    // Debería respetar el límite
    it('should respect limit parameter', async () => {
      const response = await request(app).get('/api/v1/holidays/upcoming?limit=3');

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeLessThanOrEqual(3);
    });
  });

  // GET /api/v1/holidays/year/:year - Feriados por año (Público)
  describe('GET /api/v1/holidays/year/:year - Holidays by Year', () => {
    // Debería obtener feriados por año
    it('should get holidays by year', async () => {
      const response = await request(app).get('/api/v1/holidays/year/2099');

      expect(response.status).toBe(200);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThanOrEqual(1);
    });

    // Debería validar año inválido
    it('should validate invalid year', async () => {
      const response = await request(app).get('/api/v1/holidays/year/invalid');

      expect(response.status).toBe(400);
    });
  });

  // GET /api/v1/holidays/check/:date - Verificar si es feriado (Público)
  describe('GET /api/v1/holidays/check/:date - Check Is Holiday', () => {
    // Debería retornar true para una fecha que es feriado
    it('should return true for a holiday date', async () => {
      const response = await request(app).get('/api/v1/holidays/check/2099-12-25');

      expect(response.status).toBe(200);
      expect(response.body.data.isHoliday).toBe(true);
      expect(response.body.data.holidayName).toBeDefined();
    });

    // Debería retornar false para una fecha que no es feriado
    it('should return false for a non-holiday date', async () => {
      const response = await request(app).get('/api/v1/holidays/check/2099-12-26');

      expect(response.status).toBe(200);
      expect(response.body.data.isHoliday).toBe(false);
      expect(response.body.data.holidayName).toBeUndefined();
    });

    // Debería validar formato de fecha
    it('should validate date format', async () => {
      const response = await request(app).get('/api/v1/holidays/check/invalid-date');

      expect(response.status).toBe(400);
    });
  });

  // PUT /api/v1/holidays/:id - Actualizar feriado (Admin only)
  describe('PUT /api/v1/holidays/:id - Update Holiday', () => {
    // Debería actualizar un feriado como admin
    it('should update a holiday as admin', async () => {
      const response = await request(app)
        .put(`/api/v1/holidays/${testHolidayId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'TEST Navidad Actualizado',
          description: 'TEST Nueva descripción',
        });

      expect(response.status).toBe(200);
      expect(response.body.data.name).toBe('TEST Navidad Actualizado');
      expect(response.body.data.description).toBe('TEST Nueva descripción');
    });

    // Debería rechazar actualización como cliente
    it('should reject update as client', async () => {
      const response = await request(app)
        .put(`/api/v1/holidays/${testHolidayId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'TEST Modificado',
        });

      expect(response.status).toBe(403);
    });
  });

  // ==========================================
  // SCHEDULE EXCEPTION ROUTES
  // ==========================================

  // POST /api/v1/holidays/exceptions - Crear excepción (Admin only)
  describe('POST /api/v1/holidays/exceptions - Create Schedule Exception', () => {
    // Debería crear una excepción como admin
    it('should create a schedule exception as admin', async () => {
      const response = await request(app)
        .post('/api/v1/holidays/exceptions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          exceptionDate: '2099-12-24',
          startTimeException: '09:00',
          endTimeException: '14:00',
          reason: 'TEST Horario reducido de Nochebuena',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.startTimeException).toBe('09:00');
      expect(response.body.data.endTimeException).toBe('14:00');

      testExceptionId = response.body.data.id;
    });

    // Debería crear una excepción asociada a un feriado
    it('should create an exception associated with a holiday', async () => {
      const response = await request(app)
        .post('/api/v1/holidays/exceptions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          exceptionDate: '2099-12-31',
          startTimeException: '10:00',
          endTimeException: '18:00',
          reason: 'TEST Horario especial fin de año',
          holidayId: testHolidayId,
        });

      expect(response.status).toBe(201);
      expect(response.body.data.holidayId).toBe(testHolidayId);
    });

    // Debería rechazar creación como cliente
    it('should reject creation as client', async () => {
      const response = await request(app)
        .post('/api/v1/holidays/exceptions')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          exceptionDate: '2099-06-20',
          startTimeException: '09:00',
          endTimeException: '14:00',
        });

      expect(response.status).toBe(403);
    });

    // Debería validar horarios requeridos
    it('should validate required times', async () => {
      const response = await request(app)
        .post('/api/v1/holidays/exceptions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          exceptionDate: '2099-06-21',
        });

      expect(response.status).toBe(400);
    });

    // Debería validar formato de hora
    it('should validate time format', async () => {
      const response = await request(app)
        .post('/api/v1/holidays/exceptions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          exceptionDate: '2099-06-22',
          startTimeException: '25:00',
          endTimeException: '14:00',
        });

      expect(response.status).toBe(400);
    });
  });

  // GET /api/v1/holidays/exceptions - Listar excepciones (Público)
  describe('GET /api/v1/holidays/exceptions - List Schedule Exceptions', () => {
    // Debería listar excepciones sin autenticación
    it('should list exceptions without authentication', async () => {
      const response = await request(app).get('/api/v1/holidays/exceptions');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('exceptions');
    });
  });

  // GET /api/v1/holidays/exceptions/:id - Obtener excepción por ID (Público)
  describe('GET /api/v1/holidays/exceptions/:id - Get Exception by ID', () => {
    // Debería obtener una excepción por ID
    it('should get an exception by ID', async () => {
      const response = await request(app).get(`/api/v1/holidays/exceptions/${testExceptionId}`);

      expect(response.status).toBe(200);
      expect(response.body.data.id).toBe(testExceptionId);
    });
  });

  // GET /api/v1/holidays/:holidayId/exceptions - Excepciones de un feriado
  describe('GET /api/v1/holidays/:holidayId/exceptions - Get Exceptions by Holiday', () => {
    // Debería obtener excepciones asociadas a un feriado
    it('should get exceptions associated with a holiday', async () => {
      const response = await request(app).get(`/api/v1/holidays/${testHolidayId}/exceptions`);

      expect(response.status).toBe(200);
      expect(response.body.data).toBeInstanceOf(Array);
    });
  });

  // PUT /api/v1/holidays/exceptions/:id - Actualizar excepción (Admin only)
  describe('PUT /api/v1/holidays/exceptions/:id - Update Exception', () => {
    // Debería actualizar una excepción como admin
    it('should update an exception as admin', async () => {
      const response = await request(app)
        .put(`/api/v1/holidays/exceptions/${testExceptionId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          startTimeException: '10:00',
          endTimeException: '15:00',
          reason: 'TEST Actualizada',
        });

      expect(response.status).toBe(200);
      expect(response.body.data.startTimeException).toBe('10:00');
      expect(response.body.data.endTimeException).toBe('15:00');
    });
  });

  // DELETE /api/v1/holidays/exceptions/:id - Eliminar excepción (Admin only)
  describe('DELETE /api/v1/holidays/exceptions/:id - Delete Exception', () => {
    // Debería eliminar una excepción como admin
    it('should delete an exception as admin', async () => {
      const response = await request(app)
        .delete(`/api/v1/holidays/exceptions/${testExceptionId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    // Debería rechazar eliminación como cliente
    it('should reject deletion as client', async () => {
      // Crear una nueva excepción para intentar eliminar
      const createResponse = await request(app)
        .post('/api/v1/holidays/exceptions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          exceptionDate: '2099-11-15',
          startTimeException: '09:00',
          endTimeException: '14:00',
          reason: 'TEST Para eliminar',
        });

      const response = await request(app)
        .delete(`/api/v1/holidays/exceptions/${createResponse.body.data.id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
    });
  });

  // DELETE /api/v1/holidays/:id - Eliminar feriado (Admin only)
  describe('DELETE /api/v1/holidays/:id - Delete Holiday', () => {
    // Debería rechazar eliminación como cliente
    it('should reject deletion as client', async () => {
      const response = await request(app)
        .delete(`/api/v1/holidays/${testHolidayId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
    });

    // Debería eliminar un feriado y sus excepciones asociadas como admin
    it('should delete a holiday and its associated exceptions as admin', async () => {
      const response = await request(app)
        .delete(`/api/v1/holidays/${testHolidayId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });
});
