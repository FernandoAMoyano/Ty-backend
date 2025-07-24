import request from 'supertest';
import app from '../../../src/app';
import {
  loginAsAdmin,
  createTestCategory,
  createTestService,
  cleanupTestData,
  validateServiceResponse,
  generateValidServiceData,
} from '../../setup/helpers';

describe('Service Management Integration Tests', () => {
  let adminToken: string;
  let testCategoryId: string;
  let testServiceId: string;

  beforeAll(async () => {
    // Login como admin para todas las operaciones
    adminToken = await loginAsAdmin();
  });

  beforeEach(async () => {
    // Crear una categoría de test antes de cada test
    const category = await createTestCategory(adminToken);
    testCategoryId = category.id;
  });

  afterEach(async () => {
    // Limpiar datos de test después de cada test
    await cleanupTestData();
  });

  describe('POST /api/v1/services - Create Service', () => {
    // Debería crear un nuevo servicio exitosamente
    it('should create a new service successfully', async () => {
      const serviceData = generateValidServiceData(testCategoryId, {
        name: 'Test Haircut Service',
        description: 'Professional haircut service for testing',
      });

      const response = await request(app)
        .post('/api/v1/services')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(serviceData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);

      const service = response.body.data;
      validateServiceResponse(service);

      expect(service.name).toBe(serviceData.name);
      expect(service.description).toBe(serviceData.description);
      expect(service.duration).toBe(serviceData.duration);
      expect(service.durationVariation).toBe(serviceData.durationVariation);
      expect(service.price).toBe(5000); // Precio en centavos
      expect(service.formattedPrice).toBe('50.00');
      expect(service.isActive).toBe(true);
      expect(service.category.id).toBe(testCategoryId);
      expect(service.minDuration).toBe(45); // 60 - 15
      expect(service.maxDuration).toBe(75); // 60 + 15

      testServiceId = service.id;
    });

    // Debería rechazar la creación de servicio sin autenticación
    it('should reject service creation without authentication', async () => {
      const serviceData = generateValidServiceData(testCategoryId, {
        name: 'Unauthorized Service',
      });

      const response = await request(app).post('/api/v1/services').send(serviceData);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    // Debería rechazar la creación de servicio con categoría inválida
    it('should reject service creation with invalid category', async () => {
      const serviceData = generateValidServiceData('00000000-0000-0000-0000-000000000000', {
        name: 'Invalid Category Service',
      });

      const response = await request(app)
        .post('/api/v1/services')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(serviceData);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Category not found');
    });

    // Debería rechazar nombre de servicio duplicado
    it('should reject duplicate service name', async () => {
      const serviceData = generateValidServiceData(testCategoryId, {
        name: 'Duplicate Service Name',
        description: 'First service',
      });

      // Crear primer servicio
      await request(app)
        .post('/api/v1/services')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(serviceData);

      // Intentar crear segundo servicio con el mismo nombre
      const response = await request(app)
        .post('/api/v1/services')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          ...serviceData,
          description: 'Second service with same name',
        });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('already exists');
    });

    // Debería validar los campos requeridos
    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/v1/services')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          categoryId: testCategoryId,
          // Faltan campos requeridos
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    // Debería validar que la variación de duración no exceda la duración base
    it('should validate duration variation not exceeding base duration', async () => {
      const serviceData = generateValidServiceData(testCategoryId, {
        name: 'Invalid Duration Service',
        description: 'Service with invalid duration variation',
        duration: 30,
        durationVariation: 45, // Mayor que la duración base
      });

      const response = await request(app)
        .post('/api/v1/services')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(serviceData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/services - Retrieve Services', () => {
    beforeEach(async () => {
      // Crear servicios de test usando helper
      const activeService = await createTestService(adminToken, testCategoryId, {
        name: 'Test Active Service',
        description: 'Active service for testing',
      });
      testServiceId = activeService.id;

      // Crear servicio inactivo
      const inactiveService = await createTestService(adminToken, testCategoryId, {
        name: 'Test Inactive Service',
        description: 'Inactive service for testing',
      });

      // Desactivar el segundo servicio
      await request(app)
        .patch(`/api/v1/services/${inactiveService.id}/deactivate`)
        .set('Authorization', `Bearer ${adminToken}`);
    });

    // Debería obtener todos los servicios
    it('should get all services', async () => {
      const response = await request(app).get('/api/v1/services').expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(2);

      // Verificar que incluye servicios activos e inactivos
      const activeServices = response.body.data.filter((s: any) => s.isActive);
      const inactiveServices = response.body.data.filter((s: any) => !s.isActive);

      expect(activeServices.length).toBeGreaterThanOrEqual(1);
      expect(inactiveServices.length).toBeGreaterThanOrEqual(1);
    });

    // Debería obtener solo los servicios activos
    it('should get only active services', async () => {
      const response = await request(app).get('/api/v1/services/active').expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);

      // Todos los servicios deben estar activos
      response.body.data.forEach((service: any) => {
        expect(service.isActive).toBe(true);
      });
    });

    // Debería obtener servicio por ID
    it('should get service by ID', async () => {
      const response = await request(app).get(`/api/v1/services/${testServiceId}`).expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testServiceId);
      expect(response.body.data.name).toBe('Test Active Service');
      expect(response.body.data.category).toBeDefined();
      validateServiceResponse(response.body.data);
    });

    // Debería devolver 404 para servicio inexistente
    it('should return 404 for non-existent service', async () => {
      const response = await request(app)
        .get('/api/v1/services/00000000-0000-0000-0000-000000000000')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Service not found');
    });

    // Debería obtener servicios por categoría
    it('should get services by category', async () => {
      const response = await request(app)
        .get(`/api/v1/services/category/${testCategoryId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);

      // Todos los servicios deben pertenecer a la categoría específica
      response.body.data.forEach((service: any) => {
        expect(service.category.id).toBe(testCategoryId);
      });
    });

    // Debería obtener servicios activos por categoría
    it('should get active services by category', async () => {
      const response = await request(app)
        .get(`/api/v1/services/category/${testCategoryId}/active`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);

      // Todos los servicios deben estar activos y pertenecer a la categoría
      response.body.data.forEach((service: any) => {
        expect(service.isActive).toBe(true);
        expect(service.category.id).toBe(testCategoryId);
      });
    });
  });

  describe('PUT /api/v1/services/:id - Update Service', () => {
    beforeEach(async () => {
      // Crear servicio de test usando helper
      const service = await createTestService(adminToken, testCategoryId, {
        name: 'Original Service Name',
        description: 'Original description',
      });
      testServiceId = service.id;
    });

    // Debería actualizar servicio exitosamente
    it('should update service successfully', async () => {
      const updateData = {
        name: 'Updated Service Name',
        description: 'Updated description',
        duration: 45,
        durationVariation: 10,
        price: 45.0,
      };

      const response = await request(app)
        .put(`/api/v1/services/${testServiceId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(updateData.name);
      expect(response.body.data.description).toBe(updateData.description);
      expect(response.body.data.duration).toBe(updateData.duration);
      expect(response.body.data.durationVariation).toBe(updateData.durationVariation);
      expect(response.body.data.price).toBe(4500); // Precio en centavos
      validateServiceResponse(response.body.data);
    });

    // Debería actualizar campos parciales
    it('should update partial fields', async () => {
      const updateData = {
        name: 'Partially Updated Name',
      };

      const response = await request(app)
        .put(`/api/v1/services/${testServiceId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(updateData.name);
      expect(response.body.data.description).toBe('Original description');
      validateServiceResponse(response.body.data);
    });

    // Debería rechazar actualización con nombre duplicado
    it('should reject update with duplicate name', async () => {
      // Crear otro servicio usando helper
      await createTestService(adminToken, testCategoryId, {
        name: 'Another Service',
        description: 'Another service description',
      });

      // Intentar actualizar con nombre duplicado
      const response = await request(app)
        .put(`/api/v1/services/${testServiceId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Another Service',
        });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('already exists');
    });
  });

  describe('PATCH /api/v1/services/:id/activate|deactivate - Service Status', () => {
    beforeEach(async () => {
      // Crear servicio de test usando helper
      const service = await createTestService(adminToken, testCategoryId, {
        name: 'Status Test Service',
        description: 'Service for status testing',
      });
      testServiceId = service.id;
    });

    // Debería desactivar servicio
    it('should deactivate service', async () => {
      const response = await request(app)
        .patch(`/api/v1/services/${testServiceId}/deactivate`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.isActive).toBe(false);
      validateServiceResponse(response.body.data);
    });

    // Debería activar servicio
    it('should activate service', async () => {
      // Primero desactivar
      await request(app)
        .patch(`/api/v1/services/${testServiceId}/deactivate`)
        .set('Authorization', `Bearer ${adminToken}`);

      // Luego activar
      const response = await request(app)
        .patch(`/api/v1/services/${testServiceId}/activate`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.isActive).toBe(true);
      validateServiceResponse(response.body.data);
    });
  });

  describe('DELETE /api/v1/services/:id - Delete Service', () => {
    beforeEach(async () => {
      // Crear servicio de test usando helper
      const service = await createTestService(adminToken, testCategoryId, {
        name: 'Delete Test Service',
        description: 'Service for deletion testing',
      });
      testServiceId = service.id;
    });

    // Debería eliminar servicio exitosamente
    it('should delete service successfully', async () => {
      const response = await request(app)
        .delete(`/api/v1/services/${testServiceId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('deleted successfully');

      // Verificar que el servicio ya no existe
      await request(app).get(`/api/v1/services/${testServiceId}`).expect(404);
    });

    // Debería devolver 404 al eliminar servicio inexistente
    it('should return 404 when deleting non-existent service', async () => {
      const response = await request(app)
        .delete('/api/v1/services/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Service not found');
    });
  });

  describe('Authorization Tests', () => {
    beforeEach(async () => {
      // Crear servicio de test usando helper
      const service = await createTestService(adminToken, testCategoryId, {
        name: 'Auth Test Service',
        description: 'Service for authorization testing',
      });
      testServiceId = service.id;
    });

    // Debería permitir acceso público a operaciones de lectura
    it('should allow public access to read operations', async () => {
      // Sin token de autenticación
      await request(app).get('/api/v1/services').expect(200);

      await request(app).get('/api/v1/services/active').expect(200);

      await request(app).get(`/api/v1/services/${testServiceId}`).expect(200);
    });

    // Debería requerir autenticación de administrador para operaciones de escritura
    it('should require admin authentication for write operations', async () => {
      const serviceData = generateValidServiceData(testCategoryId, {
        name: 'Unauthorized Service',
      });

      // Sin token
      await request(app).post('/api/v1/services').send(serviceData).expect(401);

      await request(app)
        .put(`/api/v1/services/${testServiceId}`)
        .send({ name: 'Updated Name' })
        .expect(401);

      await request(app).patch(`/api/v1/services/${testServiceId}/activate`).expect(401);

      await request(app).delete(`/api/v1/services/${testServiceId}`).expect(401);
    });
  });
});
