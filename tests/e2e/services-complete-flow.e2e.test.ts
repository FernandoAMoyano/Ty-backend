import request from 'supertest';
import app from '../../src/app';
import { loginAsAdmin, createTestCategory, createTestService, createTestStylist, cleanupTestData } from '../setup/helpers';

describe('Services Complete Flow E2E Tests', () => {
  afterAll(async () => {
    // Limpieza final
    await cleanupTestData();
  });

  it('should complete full services management flow', async () => {
    // 1. AUTENTICACIÓN: Login como administrador
    const adminToken = await loginAsAdmin();
    expect(adminToken).toBeDefined();

    // 2. GESTIÓN DE CATEGORÍAS: Crear categoría
    const categoryResponse = await createTestCategory(adminToken);
    expect(categoryResponse.id).toBeDefined();
    const categoryId = categoryResponse.id;

    // 3. GESTIÓN DE SERVICIOS: Crear servicio en la categoría
    const serviceResponse = await createTestService(adminToken, categoryId);
    expect(serviceResponse.id).toBeDefined();
    const serviceId = serviceResponse.id;

    // 4. GESTIÓN DE ESTILISTAS: Crear estilista
    const stylistResponse = await createTestStylist();
    expect(stylistResponse.stylistId).toBeDefined();
    const stylistId = stylistResponse.stylistId;

    // 5. ASIGNACIÓN: Asignar servicio al estilista
    const assignmentResponse = await request(app)
      .post(`/api/v1/services/stylists/${stylistId}/services`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        serviceId: serviceId,
      });

    expect(assignmentResponse.status).toBe(201);
    expect(assignmentResponse.body.success).toBe(true);
    expect(assignmentResponse.body.data.stylistId).toBe(stylistId);
    expect(assignmentResponse.body.data.serviceId).toBe(serviceId);

    // 6. CONSULTA: Verificar servicios del estilista
    const stylistServicesResponse = await request(app)
      .get(`/api/v1/services/stylists/${stylistId}/services`)
      .expect(200);

    expect(stylistServicesResponse.body.success).toBe(true);
    expect(Array.isArray(stylistServicesResponse.body.data)).toBe(true);
    expect(stylistServicesResponse.body.data.length).toBe(1);
    expect(stylistServicesResponse.body.data[0].serviceId).toBe(serviceId);

    // 7. CONSULTA: Verificar estilistas que ofrecen el servicio
    const serviceStylesResponse = await request(app)
      .get(`/api/v1/services/${serviceId}/stylists/offering`)
      .expect(200);

    expect(serviceStylesResponse.body.success).toBe(true);
    expect(Array.isArray(serviceStylesResponse.body.data)).toBe(true);
    expect(serviceStylesResponse.body.data.length).toBe(1);
    expect(serviceStylesResponse.body.data[0].stylistId).toBe(stylistId);

    // 8. ACTUALIZACIÓN: Modificar asignación con precio personalizado
    const updateResponse = await request(app)
      .put(`/api/v1/services/stylists/${stylistId}/services/${serviceId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        customPrice: 50.0,
        isOffering: true,
      });

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.success).toBe(true);
    expect(updateResponse.body.data.hasCustomPrice).toBe(true);
    expect(updateResponse.body.data.customPrice).toBe(5000); // Precio en centavos

    // 9. CONSULTA FINAL: Verificar que los cambios se aplicaron
    const finalCheckResponse = await request(app)
      .get(`/api/v1/services/stylists/${stylistId}/services`)
      .expect(200);

    const updatedAssignment = finalCheckResponse.body.data[0];
    expect(updatedAssignment.hasCustomPrice).toBe(true);
    expect(updatedAssignment.customPrice).toBe(5000);
    expect(updatedAssignment.isOffering).toBe(true);

    // 10. LIMPIEZA: Remover asignación
    const removeResponse = await request(app)
      .delete(`/api/v1/services/stylists/${stylistId}/services/${serviceId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(removeResponse.body.success).toBe(true);

    // 11. VERIFICACIÓN FINAL: Confirmar que la asignación fue removida
    const emptyServicesResponse = await request(app)
      .get(`/api/v1/services/stylists/${stylistId}/services`)
      .expect(200);

    expect(emptyServicesResponse.body.data.length).toBe(0);
  });
});
