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
  let testStylistUser: any;

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
    testStylistUser = stylist.user;
  });

  afterEach(async () => {
    // Limpiar datos de test después de cada test
    await cleanupTestData();
  });

  describe('POST /api/v1/services/stylists/:stylistId/services - Assign Service', () => {
    // Debería asignar servicio al estilista exitosamente
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
      expect(assignment.customPrice).toBeNull();
    });

    // Debería asignar servicio con precio personalizado
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

    // Debería rechazar asignación sin autenticación
    it('should reject assignment without authentication', async () => {
      const response = await request(app)
        .post(`/api/v1/services/stylists/${testStylistId}/services`)
        .send({
          serviceId: testServiceId,
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    // Debería rechazar asignación a estilista inexistente
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

    // Debería rechazar asignación de servicio inexistente
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

    // Debería rechazar asignación duplicada
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

    // Debería rechazar precio personalizado negativo
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

    // Debería obtener servicios del estilista exitosamente
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

    // Debería devolver array vacío para estilista sin servicios
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

    // Debería devolver 404 para estilista inexistente
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

    // Debería actualizar precio personalizado exitosamente
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

    // Debería actualizar estado de oferta exitosamente
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

    // Debería actualizar tanto precio como estado de oferta
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

    // Debería devolver 404 para asignación inexistente
    // Debería devolver 404 para asignación inexistente al eliminar
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

    // Debería limpiar el precio personalizado enviando customPrice: null (F5)
    it('should clear custom price when sending customPrice: null', async () => {
      // Primero fijar un precio personalizado
      await request(app)
        .put(`/api/v1/services/stylists/${testStylistId}/services/${testServiceId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ customPrice: 55.0 })
        .expect(200);

      // Ahora limpiarlo con null explícito
      const response = await request(app)
        .put(`/api/v1/services/stylists/${testStylistId}/services/${testServiceId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ customPrice: null });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.customPrice).toBeNull();
      expect(response.body.data.hasCustomPrice).toBe(false);

      // Verificar que la clave customPrice sigue presente (en null) en el GET
      const getResponse = await request(app)
        .get(`/api/v1/services/stylists/${testStylistId}/services`)
        .expect(200);

      const refreshedAssignment = getResponse.body.data.find(
        (a: any) => a.serviceId === testServiceId,
      );
      expect(refreshedAssignment).toHaveProperty('customPrice');
      expect(refreshedAssignment.customPrice).toBeNull();
    });
  });

  describe('DELETE /api/v1/services/stylists/:stylistId/services/:serviceId - Remove Assignment', () => {
    beforeEach(async () => {
      // Asignar servicio antes de cada test
      await assignServiceToStylist(adminToken, testStylistId, testServiceId);
    });

    // Debería eliminar asignación exitosamente
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

  describe('Ownership Tests (F1 - horizontal authorization)', () => {
    // Login del usuario estilista creado con createTestStylist (password fija de test)
    const loginAsStylist = async (email: string): Promise<string> => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({ email, password: 'TestPass123!' });

      if (response.status !== 200) {
        throw new Error(`Login estilista falló: ${response.status}`);
      }

      return response.body.data.token;
    };

    // Debería rechazar a un STYLIST que intenta asignar un servicio a otro estilista
    it('should reject POST when a stylist targets another stylist', async () => {
      const otherStylist = await createTestStylist();
      const otherStylistToken = await loginAsStylist(otherStylist.user.email);

      const response = await request(app)
        .post(`/api/v1/services/stylists/${testStylistId}/services`)
        .set('Authorization', `Bearer ${otherStylistToken}`)
        .send({ serviceId: testServiceId });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    // Debería permitir a un STYLIST asignarse un servicio a sí mismo
    it('should allow POST when a stylist targets itself', async () => {
      const selfToken = await loginAsStylist(testStylistUser.email);

      const response = await request(app)
        .post(`/api/v1/services/stylists/${testStylistId}/services`)
        .set('Authorization', `Bearer ${selfToken}`)
        .send({ serviceId: testServiceId });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });

    // Debería rechazar a un STYLIST que intenta actualizar la asignación de otro estilista
    it('should reject PUT when a stylist targets another stylist', async () => {
      await assignServiceToStylist(adminToken, testStylistId, testServiceId);
      const otherStylist = await createTestStylist();
      const otherStylistToken = await loginAsStylist(otherStylist.user.email);

      const response = await request(app)
        .put(`/api/v1/services/stylists/${testStylistId}/services/${testServiceId}`)
        .set('Authorization', `Bearer ${otherStylistToken}`)
        .send({ customPrice: 60.0 });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    // Debería permitir a un STYLIST actualizar su propia asignación
    it('should allow PUT when a stylist targets itself', async () => {
      await assignServiceToStylist(adminToken, testStylistId, testServiceId);
      const selfToken = await loginAsStylist(testStylistUser.email);

      const response = await request(app)
        .put(`/api/v1/services/stylists/${testStylistId}/services/${testServiceId}`)
        .set('Authorization', `Bearer ${selfToken}`)
        .send({ customPrice: 60.0 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    // Debería rechazar a un STYLIST que intenta eliminar la asignación de otro estilista
    it('should reject DELETE when a stylist targets another stylist', async () => {
      await assignServiceToStylist(adminToken, testStylistId, testServiceId);
      const otherStylist = await createTestStylist();
      const otherStylistToken = await loginAsStylist(otherStylist.user.email);

      const response = await request(app)
        .delete(`/api/v1/services/stylists/${testStylistId}/services/${testServiceId}`)
        .set('Authorization', `Bearer ${otherStylistToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    // Debería permitir a un STYLIST eliminar su propia asignación
    it('should allow DELETE when a stylist targets itself', async () => {
      await assignServiceToStylist(adminToken, testStylistId, testServiceId);
      const selfToken = await loginAsStylist(testStylistUser.email);

      const response = await request(app)
        .delete(`/api/v1/services/stylists/${testStylistId}/services/${testServiceId}`)
        .set('Authorization', `Bearer ${selfToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    // Debería permitir a ADMIN operar sobre cualquier estilista (POST/PUT/DELETE)
    it('should allow ADMIN to operate on any stylist', async () => {
      const postResponse = await request(app)
        .post(`/api/v1/services/stylists/${testStylistId}/services`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ serviceId: testServiceId });
      expect(postResponse.status).toBe(201);

      const putResponse = await request(app)
        .put(`/api/v1/services/stylists/${testStylistId}/services/${testServiceId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ customPrice: 65.0 });
      expect(putResponse.status).toBe(200);

      const deleteResponse = await request(app)
        .delete(`/api/v1/services/stylists/${testStylistId}/services/${testServiceId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(deleteResponse.status).toBe(200);
    });
  });

  describe('Authorization Tests', () => {
    beforeEach(async () => {
      await assignServiceToStylist(adminToken, testStylistId, testServiceId);
    });

    // Debería permitir acceso público a operaciones de lectura
    it('should allow public access to read operations', async () => {
      // Sin token de autenticación
      await request(app).get(`/api/v1/services/stylists/${testStylistId}/services`).expect(200);

      await request(app).get(`/api/v1/services/${testServiceId}/stylists`).expect(200);
    });

    // Debería requerir autenticación para operaciones de escritura
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
