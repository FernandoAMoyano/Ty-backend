import request from 'supertest';
import app from '../../../src/app';
import { loginAsAdmin, loginTestUser } from '../../setup/helpers';
import { testPrisma } from '../../setup/database';

// Tests de integración para el módulo de Pagos
describe('Payments Integration Tests', () => {
  let adminToken: string;
  let userToken: string;
  let stylistToken: string;
  let testAppointmentId: string;
  let testPaymentId: string;

  beforeAll(async () => {
    // Login como admin
    adminToken = await loginAsAdmin();

    // Login como usuario normal (cliente)
    const userData = await loginTestUser();
    userToken = userData.token;

    // Login como estilista
    const stylistResponse = await request(app).post('/api/v1/auth/login').send({
      email: 'lucia@turnity.com',
      password: 'stylist123',
    });
    stylistToken = stylistResponse.body.data.token;

    // Obtener una cita existente para los tests
    const appointment = await testPrisma.appointment.findFirst({
      where: {
        status: {
          name: 'Confirmada',
        },
      },
    });

    if (appointment) {
      testAppointmentId = appointment.id;
    } else {
      throw new Error('No se encontró una cita para los tests');
    }
  });

  // POST /api/v1/payments - Crear pago (Admin, Stylist)
  describe('POST /api/v1/payments - Create Payment', () => {
    // Debería crear un pago como admin
    it('should create a payment as admin', async () => {
      const response = await request(app)
        .post('/api/v1/payments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          amount: 50.0,
          appointmentId: testAppointmentId,
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.amount).toBe(50.0);
      expect(response.body.data.status).toBe('PENDING');
      expect(response.body.data.method).toBeNull();
      expect(response.body.data.appointmentId).toBe(testAppointmentId);

      // Guardar ID para tests posteriores
      testPaymentId = response.body.data.id;
    });

    // Debería crear un pago como estilista
    it('should create a payment as stylist', async () => {
      const response = await request(app)
        .post('/api/v1/payments')
        .set('Authorization', `Bearer ${stylistToken}`)
        .send({
          amount: 75.5,
          appointmentId: testAppointmentId,
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.amount).toBe(75.5);
      expect(response.body.data.status).toBe('PENDING');
    });

    // Debería rechazar creación como cliente
    it('should reject creation as client', async () => {
      const response = await request(app)
        .post('/api/v1/payments')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          amount: 50.0,
          appointmentId: testAppointmentId,
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    // Debería rechazar creación sin autenticación
    it('should reject creation without authentication', async () => {
      const response = await request(app).post('/api/v1/payments').send({
        amount: 50.0,
        appointmentId: testAppointmentId,
      });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    // Debería validar monto requerido
    it('should validate amount is required', async () => {
      const response = await request(app)
        .post('/api/v1/payments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          appointmentId: testAppointmentId,
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    // Debería validar monto mayor a 0
    it('should validate amount is greater than 0', async () => {
      const response = await request(app)
        .post('/api/v1/payments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          amount: 0,
          appointmentId: testAppointmentId,
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    // Debería validar monto negativo
    it('should validate negative amount', async () => {
      const response = await request(app)
        .post('/api/v1/payments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          amount: -50,
          appointmentId: testAppointmentId,
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    // Debería validar appointmentId requerido
    it('should validate appointmentId is required', async () => {
      const response = await request(app)
        .post('/api/v1/payments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          amount: 50.0,
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    // Debería validar formato UUID de appointmentId
    it('should validate appointmentId UUID format', async () => {
      const response = await request(app)
        .post('/api/v1/payments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          amount: 50.0,
          appointmentId: 'invalid-uuid',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  // GET /api/v1/payments - Obtener todos los pagos (Solo Admin)
  describe('GET /api/v1/payments - Get All Payments (Admin Only)', () => {
    // Debería obtener lista paginada de pagos como admin
    it('should get paginated list of payments as admin', async () => {
      const response = await request(app)
        .get('/api/v1/payments')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('payments');
      expect(response.body.data).toHaveProperty('total');
      expect(response.body.data).toHaveProperty('page');
      expect(response.body.data).toHaveProperty('limit');
      expect(response.body.data).toHaveProperty('totalPages');
      expect(response.body.data).toHaveProperty('hasNextPage');
      expect(response.body.data).toHaveProperty('hasPreviousPage');
      expect(Array.isArray(response.body.data.payments)).toBe(true);
    });

    // Debería rechazar acceso como cliente
    it('should reject access as client', async () => {
      const response = await request(app)
        .get('/api/v1/payments')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    // Debería rechazar acceso como estilista
    it('should reject access as stylist', async () => {
      const response = await request(app)
        .get('/api/v1/payments')
        .set('Authorization', `Bearer ${stylistToken}`);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    // Debería aceptar parámetros de paginación
    it('should accept pagination parameters', async () => {
      const response = await request(app)
        .get('/api/v1/payments?page=1&limit=5')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.page).toBe(1);
      expect(response.body.data.limit).toBe(5);
    });

    // Debería filtrar por estado
    it('should filter by status', async () => {
      const response = await request(app)
        .get('/api/v1/payments?status=PENDING')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      if (response.body.data.payments.length > 0) {
        response.body.data.payments.forEach((payment: any) => {
          expect(payment.status).toBe('PENDING');
        });
      }
    });

    // Debería filtrar por appointmentId
    it('should filter by appointmentId', async () => {
      const response = await request(app)
        .get(`/api/v1/payments?appointmentId=${testAppointmentId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    // Debería validar estado inválido
    it('should validate invalid status', async () => {
      const response = await request(app)
        .get('/api/v1/payments?status=INVALID_STATUS')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  // GET /api/v1/payments/statistics - Obtener estadísticas de pagos (Solo Admin)
  describe('GET /api/v1/payments/statistics - Get Payment Statistics (Admin Only)', () => {
    // Debería obtener estadísticas de pagos como admin
    it('should get payment statistics as admin', async () => {
      const response = await request(app)
        .get('/api/v1/payments/statistics')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('totalRevenue');
      expect(response.body.data).toHaveProperty('totalPayments');
      expect(response.body.data).toHaveProperty('completedPayments');
      expect(response.body.data).toHaveProperty('pendingPayments');
      expect(response.body.data).toHaveProperty('refundedPayments');
      expect(response.body.data).toHaveProperty('failedPayments');
      expect(response.body.data).toHaveProperty('averagePayment');
      expect(response.body.data).toHaveProperty('paymentsByMethod');
    });

    // Debería rechazar acceso como cliente
    it('should reject access as client', async () => {
      const response = await request(app)
        .get('/api/v1/payments/statistics')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    // Debería aceptar filtros de fecha
    it('should accept date filters', async () => {
      const startDate = '2025-01-01';
      const endDate = '2025-12-31';

      const response = await request(app)
        .get(`/api/v1/payments/statistics?startDate=${startDate}&endDate=${endDate}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  // GET /api/v1/payments/appointment/:appointmentId - Obtener pagos por cita
  describe('GET /api/v1/payments/appointment/:appointmentId - Get Payments by Appointment', () => {
    // Debería obtener pagos de una cita
    it('should get payments by appointment', async () => {
      const response = await request(app)
        .get(`/api/v1/payments/appointment/${testAppointmentId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    // Debería rechazar sin autenticación
    it('should reject without authentication', async () => {
      const response = await request(app).get(
        `/api/v1/payments/appointment/${testAppointmentId}`,
      );

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    // Debería validar formato UUID de appointmentId
    it('should validate appointmentId UUID format', async () => {
      const response = await request(app)
        .get('/api/v1/payments/appointment/invalid-uuid')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  // GET /api/v1/payments/:id - Obtener pago por ID
  describe('GET /api/v1/payments/:id - Get Payment by ID', () => {
    // Debería obtener un pago por ID
    it('should get payment by ID', async () => {
      const response = await request(app)
        .get(`/api/v1/payments/${testPaymentId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testPaymentId);
      expect(response.body.data).toHaveProperty('amount');
      expect(response.body.data).toHaveProperty('status');
      expect(response.body.data).toHaveProperty('appointmentId');
    });

    // Debería retornar 404 para pago inexistente
    it('should return 404 for non-existent payment', async () => {
      const fakeId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
      const response = await request(app)
        .get(`/api/v1/payments/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    // Debería validar formato UUID
    it('should validate UUID format', async () => {
      const response = await request(app)
        .get('/api/v1/payments/invalid-uuid')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    // Debería rechazar sin autenticación
    it('should reject without authentication', async () => {
      const response = await request(app).get(`/api/v1/payments/${testPaymentId}`);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  // POST /api/v1/payments/:id/process - Procesar pago (Admin, Stylist)
  describe('POST /api/v1/payments/:id/process - Process Payment', () => {
    let pendingPaymentId: string;

    beforeAll(async () => {
      // Crear un pago pendiente para procesar
      const createResponse = await request(app)
        .post('/api/v1/payments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          amount: 100.0,
          appointmentId: testAppointmentId,
        });
      pendingPaymentId = createResponse.body.data.id;
    });

    // Debería procesar un pago como admin
    it('should process a payment as admin', async () => {
      const response = await request(app)
        .post(`/api/v1/payments/${pendingPaymentId}/process`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          method: 'CREDIT_CARD',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('COMPLETED');
      expect(response.body.data.method).toBe('CREDIT_CARD');
      expect(response.body.data.paymentDate).toBeDefined();
    });

    // Debería procesar un pago como estilista
    it('should process a payment as stylist', async () => {
      // Crear otro pago pendiente
      const createResponse = await request(app)
        .post('/api/v1/payments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          amount: 80.0,
          appointmentId: testAppointmentId,
        });

      const response = await request(app)
        .post(`/api/v1/payments/${createResponse.body.data.id}/process`)
        .set('Authorization', `Bearer ${stylistToken}`)
        .send({
          method: 'CASH',
        });

      expect(response.status).toBe(200);
      expect(response.body.data.status).toBe('COMPLETED');
      expect(response.body.data.method).toBe('CASH');
    });

    // Debería rechazar procesar como cliente
    it('should reject process as client', async () => {
      const createResponse = await request(app)
        .post('/api/v1/payments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          amount: 60.0,
          appointmentId: testAppointmentId,
        });

      const response = await request(app)
        .post(`/api/v1/payments/${createResponse.body.data.id}/process`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          method: 'CASH',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    // Debería validar método de pago requerido
    it('should validate payment method is required', async () => {
      const createResponse = await request(app)
        .post('/api/v1/payments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          amount: 50.0,
          appointmentId: testAppointmentId,
        });

      const response = await request(app)
        .post(`/api/v1/payments/${createResponse.body.data.id}/process`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    // Debería validar método de pago válido
    it('should validate valid payment method', async () => {
      const createResponse = await request(app)
        .post('/api/v1/payments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          amount: 50.0,
          appointmentId: testAppointmentId,
        });

      const response = await request(app)
        .post(`/api/v1/payments/${createResponse.body.data.id}/process`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          method: 'INVALID_METHOD',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    // Debería aceptar todos los métodos de pago válidos
    it('should accept all valid payment methods', async () => {
      const methods = ['CASH', 'DEBIT_CARD', 'TRANSFER', 'ONLINE'];

      for (const method of methods) {
        const createResponse = await request(app)
          .post('/api/v1/payments')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            amount: 25.0,
            appointmentId: testAppointmentId,
          });

        const response = await request(app)
          .post(`/api/v1/payments/${createResponse.body.data.id}/process`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ method });

        expect(response.status).toBe(200);
        expect(response.body.data.method).toBe(method);
      }
    });
  });

  // POST /api/v1/payments/:id/refund - Reembolsar pago (Solo Admin)
  describe('POST /api/v1/payments/:id/refund - Refund Payment (Admin Only)', () => {
    let completedPaymentId: string;

    beforeAll(async () => {
      // Crear y procesar un pago para reembolsar
      const createResponse = await request(app)
        .post('/api/v1/payments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          amount: 120.0,
          appointmentId: testAppointmentId,
        });

      await request(app)
        .post(`/api/v1/payments/${createResponse.body.data.id}/process`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ method: 'CREDIT_CARD' });

      completedPaymentId = createResponse.body.data.id;
    });

    // Debería reembolsar un pago como admin
    it('should refund a payment as admin', async () => {
      const response = await request(app)
        .post(`/api/v1/payments/${completedPaymentId}/refund`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          reason: 'Cliente solicitó cancelación',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('REFUNDED');
    });

    // Debería reembolsar sin razón (razón opcional)
    it('should refund without reason (reason is optional)', async () => {
      // Crear y procesar otro pago
      const createResponse = await request(app)
        .post('/api/v1/payments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          amount: 90.0,
          appointmentId: testAppointmentId,
        });

      await request(app)
        .post(`/api/v1/payments/${createResponse.body.data.id}/process`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ method: 'CASH' });

      const response = await request(app)
        .post(`/api/v1/payments/${createResponse.body.data.id}/refund`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});

      expect(response.status).toBe(200);
      expect(response.body.data.status).toBe('REFUNDED');
    });

    // Debería rechazar reembolso como estilista
    it('should reject refund as stylist', async () => {
      // Crear y procesar un pago
      const createResponse = await request(app)
        .post('/api/v1/payments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          amount: 70.0,
          appointmentId: testAppointmentId,
        });

      await request(app)
        .post(`/api/v1/payments/${createResponse.body.data.id}/process`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ method: 'CASH' });

      const response = await request(app)
        .post(`/api/v1/payments/${createResponse.body.data.id}/refund`)
        .set('Authorization', `Bearer ${stylistToken}`)
        .send({});

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    // Debería rechazar reembolso de pago pendiente (error de regla de negocio)
    it('should reject refund of pending payment', async () => {
      const createResponse = await request(app)
        .post('/api/v1/payments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          amount: 55.0,
          appointmentId: testAppointmentId,
        });

      const response = await request(app)
        .post(`/api/v1/payments/${createResponse.body.data.id}/refund`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});

      // 422 Unprocessable Entity - Error de regla de negocio
      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
    });
  });

  // POST /api/v1/payments/:id/cancel - Cancelar pago (Admin, Stylist)
  describe('POST /api/v1/payments/:id/cancel - Cancel Payment', () => {
    // Debería cancelar un pago pendiente como admin
    it('should cancel a pending payment as admin', async () => {
      const createResponse = await request(app)
        .post('/api/v1/payments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          amount: 65.0,
          appointmentId: testAppointmentId,
        });

      const response = await request(app)
        .post(`/api/v1/payments/${createResponse.body.data.id}/cancel`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('FAILED');
    });

    // Debería cancelar un pago pendiente como estilista
    it('should cancel a pending payment as stylist', async () => {
      const createResponse = await request(app)
        .post('/api/v1/payments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          amount: 45.0,
          appointmentId: testAppointmentId,
        });

      const response = await request(app)
        .post(`/api/v1/payments/${createResponse.body.data.id}/cancel`)
        .set('Authorization', `Bearer ${stylistToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.status).toBe('FAILED');
    });

    // Debería rechazar cancelar como cliente
    it('should reject cancel as client', async () => {
      const createResponse = await request(app)
        .post('/api/v1/payments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          amount: 35.0,
          appointmentId: testAppointmentId,
        });

      const response = await request(app)
        .post(`/api/v1/payments/${createResponse.body.data.id}/cancel`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    // Debería rechazar cancelar pago completado (error de regla de negocio)
    it('should reject cancel of completed payment', async () => {
      const createResponse = await request(app)
        .post('/api/v1/payments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          amount: 85.0,
          appointmentId: testAppointmentId,
        });

      await request(app)
        .post(`/api/v1/payments/${createResponse.body.data.id}/process`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ method: 'CASH' });

      const response = await request(app)
        .post(`/api/v1/payments/${createResponse.body.data.id}/cancel`)
        .set('Authorization', `Bearer ${adminToken}`);

      // 422 Unprocessable Entity - Error de regla de negocio
      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
    });
  });

  // PUT /api/v1/payments/:id - Actualizar pago (Solo Admin)
  describe('PUT /api/v1/payments/:id - Update Payment (Admin Only)', () => {
    // Debería actualizar el monto de un pago pendiente como admin
    it('should update amount of a pending payment as admin', async () => {
      const createResponse = await request(app)
        .post('/api/v1/payments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          amount: 100.0,
          appointmentId: testAppointmentId,
        });

      const response = await request(app)
        .put(`/api/v1/payments/${createResponse.body.data.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          amount: 150.0,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.amount).toBe(150.0);
    });

    // Debería rechazar actualización como estilista
    it('should reject update as stylist', async () => {
      const createResponse = await request(app)
        .post('/api/v1/payments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          amount: 100.0,
          appointmentId: testAppointmentId,
        });

      const response = await request(app)
        .put(`/api/v1/payments/${createResponse.body.data.id}`)
        .set('Authorization', `Bearer ${stylistToken}`)
        .send({
          amount: 150.0,
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    // Debería rechazar actualización de pago completado (error de regla de negocio)
    it('should reject update of completed payment', async () => {
      const createResponse = await request(app)
        .post('/api/v1/payments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          amount: 100.0,
          appointmentId: testAppointmentId,
        });

      await request(app)
        .post(`/api/v1/payments/${createResponse.body.data.id}/process`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ method: 'CASH' });

      const response = await request(app)
        .put(`/api/v1/payments/${createResponse.body.data.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          amount: 200.0,
        });

      // 422 Unprocessable Entity - Error de regla de negocio
      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
    });

    // Debería validar monto mayor a 0
    it('should validate amount is greater than 0', async () => {
      const createResponse = await request(app)
        .post('/api/v1/payments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          amount: 100.0,
          appointmentId: testAppointmentId,
        });

      const response = await request(app)
        .put(`/api/v1/payments/${createResponse.body.data.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          amount: 0,
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    // Debería validar formato UUID
    it('should validate UUID format', async () => {
      const response = await request(app)
        .put('/api/v1/payments/invalid-uuid')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          amount: 100.0,
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });
});
