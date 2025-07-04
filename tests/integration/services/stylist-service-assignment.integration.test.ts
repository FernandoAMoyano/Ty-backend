import request from 'supertest';
import app from '../../../src/app';
import {
  loginAsAdmin,
  createTestCategory,
  createTestService,
  createTestStylist,
  assignServiceToStylist,
  cleanupTestData,
  validateStylistServiceResponse,
} from '../../setup/helpers';

describe('Stylist Service Assignment Integration Tests', () => {
  let adminToken: string;
  let testCategoryId: string;
  let testServiceId: string;
  let testStylistId: string;

  beforeAll(async () => {
    // Login como admin para todas las operaciones
    adminToken = await loginAsAdmin();
  });

  beforeEach(async () => {
    // Crear categoría y servicio de test
    const category = await createTestCategory(adminToken);
    testCategoryId = category.id;

    const service = await createTestService(adminToken, testCategoryId);
    testServiceId = service.id;

    // Crear estilista de test
    const stylist = await createTestStylist();
    testStylistId = stylist.stylistId;
  });

  afterEach(async () => {
    // Limpiar datos de test después de cada test
    await cleanupTestData();
  });

  describe('POST /api/v1/services/stylists/:stylistId/services - Assign Service', () => {
    it('should assign service to stylist successfully', async () => {
      const response = await request(app)
        .post(`/api/v1/services/stylists/${testStylistId}/services`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          serviceId: testServiceId,
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('assigned');

      const assignment = response.body.data;
      validateStylistServiceResponse(assignment);

      expect(assignment.stylistId).toBe(testStylistId);
      expect(assignment.serviceId).toBe(testServiceId);
      expect(assignment.isOffering).toBe(true); // Default value
      expect(assignment.hasCustomPrice).toBe(false); // No custom price
      expect(assignment.customPrice).toBeUndefined();
    });

    it('should assign service with custom price', async () => {
      const customPrice = 75.0;

      const response = await request(app)
        .post(`/api/v1/services/stylists/${testStylistId}/services`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          serviceId: testServiceId,
          customPrice: customPrice,
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);

      const assignment = response.body.data;
      validateStylistServiceResponse(assignment);

      expect(assignment.customPrice).toBe(7500);
      expect(assignment.hasCustomPrice).toBe(true);
      expect(assignment.effectivePrice).toBe(7500);
      expect(assignment.formattedEffectivePrice).toBe('75.00');
    });

    it('should reject assignment without authentication', async () => {
      const response = await request(app)
        .post(`/api/v1/services/stylists/${testStylistId}/services`)
        .send({
          serviceId: testServiceId,
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should reject assignment to non-existent stylist', async () => {
      const response = await request(app)
        .post('/api/v1/services/stylists/00000000-0000-0000-0000-000000000000/services')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          serviceId: testServiceId,
        });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Stylist not found');
    });

    it('should reject assignment of non-existent service', async () => {
      const response = await request(app)
        .post(`/api/v1/services/stylists/${testStylistId}/services`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          serviceId: '00000000-0000-0000-0000-000000000000',
        });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Service not found');
    });

    it('should reject duplicate assignment', async () => {
      // Asignar servicio por primera vez
      await assignServiceToStylist(adminToken, testStylistId, testServiceId);

      // Intentar asignar el mismo servicio otra vez
      const response = await request(app)
        .post(`/api/v1/services/stylists/${testStylistId}/services`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          serviceId: testServiceId,
        });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('already assigned');
    });

    it('should reject negative custom price', async () => {
      const response = await request(app)
        .post(`/api/v1/services/stylists/${testStylistId}/services`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          serviceId: testServiceId,
          customPrice: -1000,
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('negative');
    });
  });

  describe('GET /api/v1/services/stylists/:stylistId/services - Get Stylist Services', () => {
    beforeEach(async () => {
      // Asignar algunos servicios al estilista
      await assignServiceToStylist(adminToken, testStylistId, testServiceId);
    });

    it('should get stylist services successfully', async () => {
      const response = await request(app)
        .get(`/api/v1/services/stylists/${testStylistId}/services`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(1);

      const assignment = response.body.data[0];
      validateStylistServiceResponse(assignment);
      expect(assignment.stylistId).toBe(testStylistId);
      expect(assignment.serviceId).toBe(testServiceId);
    });

    it('should return empty array for stylist with no services', async () => {
      // Crear otro estilista sin servicios
      const newStylist = await createTestStylist();

      const response = await request(app)
        .get(`/api/v1/services/stylists/${newStylist.stylistId}/services`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(0);
    });

    it('should return 404 for non-existent stylist', async () => {
      const response = await request(app)
        .get('/api/v1/services/stylists/00000000-0000-0000-0000-000000000000/services')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Stylist not found');
    });
  });

  describe('PUT /api/v1/services/stylists/:stylistId/services/:serviceId - Update Assignment', () => {
    beforeEach(async () => {
      // Asignar servicio antes de cada test
      await assignServiceToStylist(adminToken, testStylistId, testServiceId);
    });

    it('should update custom price successfully', async () => {
      const newCustomPrice = 80.0;

      const response = await request(app)
        .put(`/api/v1/services/stylists/${testStylistId}/services/${testServiceId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          customPrice: newCustomPrice,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      const assignment = response.body.data;
      validateStylistServiceResponse(assignment);

      expect(assignment.customPrice).toBe(8000);
      expect(assignment.hasCustomPrice).toBe(true);
      expect(assignment.effectivePrice).toBe(8000);
      expect(assignment.formattedEffectivePrice).toBe('80.00');
    });

    it('should update offering status successfully', async () => {
      const response = await request(app)
        .put(`/api/v1/services/stylists/${testStylistId}/services/${testServiceId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          isOffering: false,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      const assignment = response.body.data;
      expect(assignment.isOffering).toBe(false);
    });

    it('should update both price and offering status', async () => {
      const newCustomPrice = 90.0;

      const response = await request(app)
        .put(`/api/v1/services/stylists/${testStylistId}/services/${testServiceId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          customPrice: newCustomPrice,
          isOffering: false,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      const assignment = response.body.data;
      expect(assignment.customPrice).toBe(9000);
      expect(assignment.isOffering).toBe(false);
      expect(assignment.effectivePrice).toBe(9000);
    });

    it('should return 404 for non-existent assignment', async () => {
      // Crear otro servicio que no está asignado
      const anotherService = await createTestService(adminToken, testCategoryId, {
        name: 'Another Service',
      });

      const response = await request(app)
        .put(`/api/v1/services/stylists/${testStylistId}/services/${anotherService.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          customPrice: 5000,
        });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('assignment');
    });
  });

  describe('DELETE /api/v1/services/stylists/:stylistId/services/:serviceId - Remove Assignment', () => {
    beforeEach(async () => {
      // Asignar servicio antes de cada test
      await assignServiceToStylist(adminToken, testStylistId, testServiceId);
    });

    it('should remove assignment successfully', async () => {
      const response = await request(app)
        .delete(`/api/v1/services/stylists/${testStylistId}/services/${testServiceId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('removed');

      // Verificar que la asignación ya no existe
      const stylistServices = await request(app)
        .get(`/api/v1/services/stylists/${testStylistId}/services`)
        .expect(200);

      expect(stylistServices.body.data.length).toBe(0);
    });

    it('should return 404 for non-existent assignment', async () => {
      // Crear otro servicio que no está asignado
      const anotherService = await createTestService(adminToken, testCategoryId, {
        name: 'Another Service',
      });

      const response = await request(app)
        .delete(`/api/v1/services/stylists/${testStylistId}/services/${anotherService.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('assignment');
    });
  });

  describe('Authorization Tests', () => {
    beforeEach(async () => {
      await assignServiceToStylist(adminToken, testStylistId, testServiceId);
    });

    it('should allow public access to read operations', async () => {
      // Sin token de autenticación
      await request(app).get(`/api/v1/services/stylists/${testStylistId}/services`).expect(200);

      await request(app).get(`/api/v1/services/${testServiceId}/stylists`).expect(200);
    });

    it('should require authentication for write operations', async () => {
      // Sin token
      await request(app)
        .post(`/api/v1/services/stylists/${testStylistId}/services`)
        .send({ serviceId: testServiceId })
        .expect(401);

      await request(app)
        .put(`/api/v1/services/stylists/${testStylistId}/services/${testServiceId}`)
        .send({ customPrice: 5000 })
        .expect(401);

      await request(app)
        .delete(`/api/v1/services/stylists/${testStylistId}/services/${testServiceId}`)
        .expect(401);
    });
  });
});
