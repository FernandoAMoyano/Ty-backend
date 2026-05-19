import request from 'supertest';
import app from '../../src/app';
import { loginAsAdmin, loginTestUser } from '../setup/helpers';
import { testPrisma } from '../setup/database';

// Tests E2E para el flujo completo del módulo de Feriados
describe('Holidays Complete Flow E2E Tests', () => {
  let adminToken: string;
  let userToken: string;

  beforeAll(async () => {
    // Login como admin
    adminToken = await loginAsAdmin();

    // Crear y loguear usuario de prueba (cliente)
    const userData = await loginTestUser();
    userToken = userData.token;

    // Limpiar datos de pruebas E2E anteriores
    await testPrisma.scheduleException.deleteMany({
      where: {
        reason: {
          contains: 'E2E_TEST',
        },
      },
    });
    await testPrisma.holiday.deleteMany({
      where: {
        name: {
          contains: 'E2E_TEST',
        },
      },
    });
  });

  afterAll(async () => {
    // Limpiar datos de pruebas E2E
    await testPrisma.scheduleException.deleteMany({
      where: {
        reason: {
          contains: 'E2E_TEST',
        },
      },
    });
    await testPrisma.holiday.deleteMany({
      where: {
        name: {
          contains: 'E2E_TEST',
        },
      },
    });
  });

  /**
   * FLUJO COMPLETO: Gestión de feriados y excepciones de horario
   *
   * Este test simula el flujo completo desde la perspectiva del negocio:
   * 1. Admin crea feriados para el año
   * 2. Se consultan los feriados creados
   * 3. Se verifican próximos feriados
   * 4. Se verifica si una fecha es feriado
   * 5. Admin crea excepciones de horario asociadas
   * 6. Se actualizan feriados y excepciones
   * 7. Se eliminan excepciones y feriados
   */
  // Flujo completo de gestión de feriados y excepciones
  it('should complete full holiday and schedule exception lifecycle', async () => {
    // ==========================================
    // FASE 1: CREACIÓN DE FERIADOS
    // ==========================================

    // 1.1 Admin crea el primer feriado (Navidad)
    const createNavidadResponse = await request(app)
      .post('/api/v1/holidays')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'E2E_TEST Navidad',
        date: '2099-12-25',
        description: 'E2E_TEST Día de Navidad - Salón cerrado',
      });

    expect(createNavidadResponse.status).toBe(201);
    expect(createNavidadResponse.body.success).toBe(true);
    expect(createNavidadResponse.body.data.name).toBe('E2E_TEST Navidad');

    const navidadId = createNavidadResponse.body.data.id;

    // 1.2 Admin crea el segundo feriado (Año Nuevo)
    const createAnoNuevoResponse = await request(app)
      .post('/api/v1/holidays')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'E2E_TEST Año Nuevo',
        date: '2099-01-01',
        description: 'E2E_TEST Primer día del año',
      });

    expect(createAnoNuevoResponse.status).toBe(201);
    const anoNuevoId = createAnoNuevoResponse.body.data.id;

    // 1.3 Admin crea un tercer feriado (Día del Trabajo)
    const createDiaTrabajoResponse = await request(app)
      .post('/api/v1/holidays')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'E2E_TEST Día del Trabajo',
        date: '2099-05-01',
      });

    expect(createDiaTrabajoResponse.status).toBe(201);
    expect(createDiaTrabajoResponse.body.data.description).toBeNull();

    const diaTrabajoId = createDiaTrabajoResponse.body.data.id;

    // 1.4 Verificar que cliente no puede crear feriados
    const clientCreateAttempt = await request(app)
      .post('/api/v1/holidays')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        name: 'E2E_TEST Feriado Falso',
        date: '2099-06-15',
      });

    expect(clientCreateAttempt.status).toBe(401);

    // ==========================================
    // FASE 2: CONSULTA DE FERIADOS
    // ==========================================

    // 2.1 Consultar feriados por año (público)
    const getByYearResponse = await request(app).get('/api/v1/holidays/year/2099');

    expect(getByYearResponse.status).toBe(200);
    expect(getByYearResponse.body.data.length).toBeGreaterThanOrEqual(3);

    // 2.2 Consultar feriados próximos (público)
    const upcomingResponse = await request(app).get('/api/v1/holidays/upcoming?limit=10');

    expect(upcomingResponse.status).toBe(200);
    expect(upcomingResponse.body.data).toBeInstanceOf(Array);

    // 2.3 Consultar un feriado específico por ID
    const getByIdResponse = await request(app).get(`/api/v1/holidays/${navidadId}`);

    expect(getByIdResponse.status).toBe(200);
    expect(getByIdResponse.body.data.name).toBe('E2E_TEST Navidad');

    // 2.4 Verificar si una fecha es feriado
    const checkHolidayResponse = await request(app).get('/api/v1/holidays/check/2099-12-25');

    expect(checkHolidayResponse.status).toBe(200);
    expect(checkHolidayResponse.body.data.isHoliday).toBe(true);
    expect(checkHolidayResponse.body.data.holiday.name).toBe('E2E_TEST Navidad');

    // 2.5 Verificar que una fecha normal no es feriado
    const checkNonHolidayResponse = await request(app).get('/api/v1/holidays/check/2099-12-26');

    expect(checkNonHolidayResponse.status).toBe(200);
    expect(checkNonHolidayResponse.body.data.isHoliday).toBe(false);

    // ==========================================
    // FASE 3: CREACIÓN DE EXCEPCIONES DE HORARIO
    // ==========================================

    // 3.1 Admin crea excepción para Nochebuena (horario reducido)
    const createNochebuenaException = await request(app)
      .post('/api/v1/holidays/exceptions')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        exceptionDate: '2099-12-24',
        startTimeException: '09:00',
        endTimeException: '14:00',
        reason: 'E2E_TEST Horario reducido de Nochebuena',
      });

    expect(createNochebuenaException.status).toBe(201);
    expect(createNochebuenaException.body.data.startTimeException).toBe('09:00');
    expect(createNochebuenaException.body.data.endTimeException).toBe('14:00');

    const nochebuenaExceptionId = createNochebuenaException.body.data.id;

    // 3.2 Admin crea excepción asociada a Navidad
    const createNavidadException = await request(app)
      .post('/api/v1/holidays/exceptions')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        exceptionDate: '2099-12-25',
        startTimeException: '00:00',
        endTimeException: '23:59',
        reason: 'E2E_TEST Salón cerrado por Navidad',
        holidayId: navidadId,
      });

    expect(createNavidadException.status).toBe(201);
    expect(createNavidadException.body.data.holidayId).toBe(navidadId);

    const navidadExceptionId = createNavidadException.body.data.id;

    // 3.3 Admin crea excepción para Año Nuevo
    const createAnoNuevoException = await request(app)
      .post('/api/v1/holidays/exceptions')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        exceptionDate: '2099-01-01',
        startTimeException: '12:00',
        endTimeException: '18:00',
        reason: 'E2E_TEST Horario especial de Año Nuevo',
        holidayId: anoNuevoId,
      });

    expect(createAnoNuevoException.status).toBe(201);

    // 3.4 Verificar que cliente no puede crear excepciones
    const clientExceptionAttempt = await request(app)
      .post('/api/v1/holidays/exceptions')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        exceptionDate: '2099-07-04',
        startTimeException: '09:00',
        endTimeException: '14:00',
        reason: 'E2E_TEST Intento no autorizado',
      });

    expect(clientExceptionAttempt.status).toBe(401);

    // ==========================================
    // FASE 4: CONSULTA DE EXCEPCIONES
    // ==========================================

    // 4.1 Listar todas las excepciones (público)
    const listExceptionsResponse = await request(app).get('/api/v1/holidays/exceptions');

    expect(listExceptionsResponse.status).toBe(200);
    expect(listExceptionsResponse.body.data.data.length).toBeGreaterThanOrEqual(2);

    // 4.2 Obtener excepción por ID
    const getExceptionByIdResponse = await request(app).get(
      `/api/v1/holidays/exceptions/${nochebuenaExceptionId}`,
    );

    expect(getExceptionByIdResponse.status).toBe(200);
    expect(getExceptionByIdResponse.body.data.reason).toContain('Nochebuena');

    // 4.3 Obtener excepciones de un feriado específico
    const getExceptionsByHolidayResponse = await request(app).get(
      `/api/v1/holidays/${navidadId}/exceptions`,
    );

    expect(getExceptionsByHolidayResponse.status).toBe(200);
    expect(getExceptionsByHolidayResponse.body.data.length).toBeGreaterThanOrEqual(1);

    // 4.4 Obtener próximas excepciones
    const upcomingExceptionsResponse = await request(app).get(
      '/api/v1/holidays/exceptions/upcoming?limit=5',
    );

    expect(upcomingExceptionsResponse.status).toBe(200);
    expect(upcomingExceptionsResponse.body.data).toBeInstanceOf(Array);

    // ==========================================
    // FASE 5: ACTUALIZACIÓN DE DATOS
    // ==========================================

    // 5.1 Admin actualiza el nombre del feriado
    const updateHolidayResponse = await request(app)
      .put(`/api/v1/holidays/${navidadId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'E2E_TEST Navidad Actualizada',
        description: 'E2E_TEST Descripción actualizada de Navidad',
      });

    expect(updateHolidayResponse.status).toBe(200);
    expect(updateHolidayResponse.body.data.name).toBe('E2E_TEST Navidad Actualizada');

    // 5.2 Admin actualiza la excepción de horario
    const updateExceptionResponse = await request(app)
      .put(`/api/v1/holidays/exceptions/${nochebuenaExceptionId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        startTimeException: '10:00',
        endTimeException: '15:00',
        reason: 'E2E_TEST Horario actualizado de Nochebuena',
      });

    expect(updateExceptionResponse.status).toBe(200);
    expect(updateExceptionResponse.body.data.startTimeException).toBe('10:00');
    expect(updateExceptionResponse.body.data.endTimeException).toBe('15:00');

    // 5.3 Verificar que cliente no puede actualizar
    const clientUpdateAttempt = await request(app)
      .put(`/api/v1/holidays/${navidadId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        name: 'E2E_TEST Intento de modificación',
      });

    expect(clientUpdateAttempt.status).toBe(401);

    // ==========================================
    // FASE 6: ELIMINACIÓN DE DATOS
    // ==========================================

    // 6.1 Verificar que cliente no puede eliminar excepciones
    const clientDeleteExceptionAttempt = await request(app)
      .delete(`/api/v1/holidays/exceptions/${nochebuenaExceptionId}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(clientDeleteExceptionAttempt.status).toBe(401);

    // 6.2 Admin elimina la excepción de Nochebuena
    const deleteExceptionResponse = await request(app)
      .delete(`/api/v1/holidays/exceptions/${nochebuenaExceptionId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(deleteExceptionResponse.status).toBe(200);
    expect(deleteExceptionResponse.body.success).toBe(true);

    // 6.3 Verificar que la excepción fue eliminada
    const checkDeletedExceptionResponse = await request(app).get(
      `/api/v1/holidays/exceptions/${nochebuenaExceptionId}`,
    );

    expect(checkDeletedExceptionResponse.status).toBe(500); // O 404 con NotFoundError

    // 6.4 Verificar que cliente no puede eliminar feriados
    const clientDeleteHolidayAttempt = await request(app)
      .delete(`/api/v1/holidays/${diaTrabajoId}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(clientDeleteHolidayAttempt.status).toBe(401);

    // 6.5 Admin elimina el feriado de Día del Trabajo (sin excepciones)
    const deleteHolidayResponse = await request(app)
      .delete(`/api/v1/holidays/${diaTrabajoId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(deleteHolidayResponse.status).toBe(200);
    expect(deleteHolidayResponse.body.success).toBe(true);

    // 6.6 Admin elimina Navidad (con excepciones asociadas - debe eliminar cascada)
    const deleteNavidadResponse = await request(app)
      .delete(`/api/v1/holidays/${navidadId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(deleteNavidadResponse.status).toBe(200);

    // 6.7 Verificar que la excepción asociada a Navidad también fue eliminada
    const checkDeletedNavidadExceptionResponse = await request(app).get(
      `/api/v1/holidays/exceptions/${navidadExceptionId}`,
    );

    expect(checkDeletedNavidadExceptionResponse.status).toBe(500); // O 404 con NotFoundError

    // 6.8 Admin elimina el feriado de Año Nuevo
    const deleteAnoNuevoResponse = await request(app)
      .delete(`/api/v1/holidays/${anoNuevoId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(deleteAnoNuevoResponse.status).toBe(200);
  });

  /**
   * FLUJO DE VALIDACIONES Y ERRORES
   *
   * Este test verifica el manejo correcto de errores y validaciones
   */
  // Flujo de validaciones y errores
  it('should handle validation errors correctly', async () => {
    // 1. Validación de fecha requerida
    const noDateResponse = await request(app)
      .post('/api/v1/holidays')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'E2E_TEST Sin Fecha',
      });

    expect(noDateResponse.status).toBe(400);

    // 2. Validación de nombre requerido
    const noNameResponse = await request(app)
      .post('/api/v1/holidays')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        date: '2099-08-15',
      });

    expect(noNameResponse.status).toBe(400);

    // 3. Validación de formato de fecha
    const invalidDateResponse = await request(app)
      .post('/api/v1/holidays')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'E2E_TEST Fecha Inválida',
        date: 'fecha-invalida',
      });

    expect(invalidDateResponse.status).toBe(400);

    // 4. Validación de formato de hora en excepciones
    const invalidTimeResponse = await request(app)
      .post('/api/v1/holidays/exceptions')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        exceptionDate: '2099-09-01',
        startTimeException: '25:00',
        endTimeException: '14:00',
        reason: 'E2E_TEST Hora inválida',
      });

    expect(invalidTimeResponse.status).toBe(400);

    // 5. Validación de UUID inválido
    const invalidUuidResponse = await request(app).get('/api/v1/holidays/invalid-uuid');

    expect(invalidUuidResponse.status).toBe(400);
  });

  /**
   * FLUJO DE CONSULTAS PÚBLICAS
   *
   * Este test verifica que las rutas públicas funcionen correctamente
   */
  // Flujo de consultas públicas (sin autenticación)
  it('should allow public access to read endpoints', async () => {
    // Crear un feriado de prueba
    const createResponse = await request(app)
      .post('/api/v1/holidays')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'E2E_TEST Feriado Público',
        date: '2099-10-12',
      });

    const holidayId = createResponse.body.data.id;

    // 1. Listar feriados sin autenticación
    const listResponse = await request(app).get('/api/v1/holidays');
    expect(listResponse.status).toBe(200);

    // 2. Obtener feriado por ID sin autenticación
    const getByIdResponse = await request(app).get(`/api/v1/holidays/${holidayId}`);
    expect(getByIdResponse.status).toBe(200);

    // 3. Obtener feriados por año sin autenticación
    const getByYearResponse = await request(app).get('/api/v1/holidays/year/2099');
    expect(getByYearResponse.status).toBe(200);

    // 4. Obtener próximos feriados sin autenticación
    const upcomingResponse = await request(app).get('/api/v1/holidays/upcoming');
    expect(upcomingResponse.status).toBe(200);

    // 5. Verificar si fecha es feriado sin autenticación
    const checkResponse = await request(app).get('/api/v1/holidays/check/2099-10-12');
    expect(checkResponse.status).toBe(200);

    // 6. Listar excepciones sin autenticación
    const exceptionsResponse = await request(app).get('/api/v1/holidays/exceptions');
    expect(exceptionsResponse.status).toBe(200);

    // Limpiar
    await request(app)
      .delete(`/api/v1/holidays/${holidayId}`)
      .set('Authorization', `Bearer ${adminToken}`);
  });
});
