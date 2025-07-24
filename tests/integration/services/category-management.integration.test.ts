import request from 'supertest';
import app from '../../../src/app';
import {
  loginAsAdmin,
  createTestCategory,
  cleanupTestData,
  validateCategoryResponse,
  generateValidCategoryData,
  generateUniqueName,
} from '../../setup/helpers';

describe('Category Management Integration Tests', () => {
  let adminToken: string;
  let testCategoryId: string;

  beforeAll(async () => {
    // Login como admin para todas las operaciones
    adminToken = await loginAsAdmin();
  });

  afterEach(async () => {
    // Limpiar datos de test después de cada test
    await cleanupTestData();
  });

  describe('POST /api/v1/categories - Create Category', () => {
    // Debería crear una nueva categoría exitosamente
    it('should create a new category successfully', async () => {
      const categoryData = generateValidCategoryData({
        name: generateUniqueName('Test Hair Services'),
        description: 'Professional hair services for testing',
      });

      const response = await request(app)
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(categoryData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);

      const category = response.body.data;
      validateCategoryResponse(category);

      expect(category.name).toBe(categoryData.name);
      expect(category.description).toBe(categoryData.description);
      expect(category.isActive).toBe(true);

      testCategoryId = category.id;
    });

    // Debería crear categoría con datos mínimos
    it('should create category with minimal data', async () => {
      const categoryData = {
        name: generateUniqueName('Minimal Test Category'),
      };

      const response = await request(app)
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(categoryData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);

      const category = response.body.data;
      expect(category.name).toBe(categoryData.name);
      expect(category.description).toBeUndefined();
      expect(category.isActive).toBe(true);
    });

    // Debería rechazar la creación de categoría sin autenticación
    it('should reject category creation without authentication', async () => {
      const categoryData = generateValidCategoryData({
        name: generateUniqueName('Unauthorized Category'),
      });

      const response = await request(app).post('/api/v1/categories').send(categoryData);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    // Debería rechazar nombre de categoría duplicado
    it('should reject duplicate category name', async () => {
      const categoryData = generateValidCategoryData({
        name: generateUniqueName('Duplicate Category Name'),
        description: 'First category',
      });

      // Crear primera categoría
      await request(app)
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(categoryData);

      // Intentar crear segunda categoría con el mismo nombre
      const response = await request(app)
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          ...categoryData,
          description: 'Second category with same name',
        });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('already exists');
    });

    // Debería validar los campos requeridos
    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          description: 'Category without name',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    // Debería rechazar caracteres especiales en el nombre
    it('should reject special characters in name', async () => {
      const categoryData = generateValidCategoryData({
        name: 'Test Category & Spa Services (Premium)',
        description: 'Category with special characters test',
      });

      const response = await request(app)
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(categoryData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('letters and spaces');
    });

    // Debería eliminar espacios en blanco del nombre
    it('should trim whitespace from name', async () => {
      const categoryData = {
        name: `  ${generateUniqueName('Test Category with Spaces')}  `,
        description: 'Testing whitespace handling',
      };

      const response = await request(app)
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(categoryData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(categoryData.name.trim());
    });
  });

  describe('GET /api/v1/categories - Retrieve Categories', () => {
    beforeEach(async () => {
      // Crear categorías de test
      const activeCategory = await createTestCategory(adminToken, {
        name: generateUniqueName('Test Active Category'),
        description: 'Active category for testing',
      });
      testCategoryId = activeCategory.id;

      // Crear categoría inactiva
      const inactiveCategory = await createTestCategory(adminToken, {
        name: generateUniqueName('Test Inactive Category'),
        description: 'Inactive category for testing',
      });

      // Desactivar la segunda categoría
      await request(app)
        .patch(`/api/v1/categories/${inactiveCategory.id}/deactivate`)
        .set('Authorization', `Bearer ${adminToken}`);
    });

    // Debería obtener todas las categorías
    it('should get all categories', async () => {
      const response = await request(app).get('/api/v1/categories').expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(2);

      // Verificar que incluye categorías activas e inactivas
      const activeCategories = response.body.data.filter((c: any) => c.isActive);
      const inactiveCategories = response.body.data.filter((c: any) => !c.isActive);

      expect(activeCategories.length).toBeGreaterThanOrEqual(1);
      expect(inactiveCategories.length).toBeGreaterThanOrEqual(1);

      // Validar estructura de respuesta
      response.body.data.forEach((category: any) => {
        validateCategoryResponse(category);
      });
    });

    // Debería obtener solo las categorías activas
    it('should get only active categories', async () => {
      const response = await request(app).get('/api/v1/categories/active').expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);

      // Todas las categorías deben estar activas
      response.body.data.forEach((category: any) => {
        expect(category.isActive).toBe(true);
        validateCategoryResponse(category);
      });
    });

    // Debería obtener categoría por ID
    it('should get category by ID', async () => {
      const response = await request(app).get(`/api/v1/categories/${testCategoryId}`).expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testCategoryId);
      validateCategoryResponse(response.body.data);
    });

    // Debería devolver 404 para categoría inexistente
    it('should return 404 for non-existent category', async () => {
      const response = await request(app)
        .get('/api/v1/categories/00000000-0000-0000-0000-000000000000')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Category not found');
    });

    // Debería permitir acceso público a operaciones de lectura
    it('should allow public access to read operations', async () => {
      // Sin token de autenticación
      await request(app).get('/api/v1/categories').expect(200);
      await request(app).get('/api/v1/categories/active').expect(200);
      await request(app).get(`/api/v1/categories/${testCategoryId}`).expect(200);
    });
  });

  describe('PUT /api/v1/categories/:id - Update Category', () => {
    beforeEach(async () => {
      // Crear categoría de test con nombre único
      const category = await createTestCategory(adminToken, {
        name: generateUniqueName('Original Category Name'),
        description: 'Original description',
      });
      testCategoryId = category.id;
    });

    // Debería actualizar categoría exitosamente
    it('should update category successfully', async () => {
      const updateData = {
        name: generateUniqueName('Updated Category Name'),
        description: 'Updated description',
      };

      const response = await request(app)
        .put(`/api/v1/categories/${testCategoryId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(updateData.name);
      expect(response.body.data.description).toBe(updateData.description);
      validateCategoryResponse(response.body.data);
    });

    // Debería actualizar campos parciales
    it('should update partial fields', async () => {
      const updateData = {
        name: generateUniqueName('Partially Updated Name'),
      };

      const response = await request(app)
        .put(`/api/v1/categories/${testCategoryId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(updateData.name);
      expect(response.body.data.description).toBe('Original description');
      validateCategoryResponse(response.body.data);
    });

    // Debería rechazar actualización con nombre duplicado
    it('should reject update with duplicate name', async () => {
      // Crear otra categoría con nombre conocido
      const duplicateName = generateUniqueName('Another Category');
      await createTestCategory(adminToken, {
        name: duplicateName,
        description: 'Another category description',
      });

      // Intentar actualizar con el mismo nombre exacto
      const response = await request(app)
        .put(`/api/v1/categories/${testCategoryId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: duplicateName, // Usar el mismo nombre
        });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('already exists');
    });

    // Debería rechazar actualización sin autenticación
    it('should reject update without authentication', async () => {
      const response = await request(app)
        .put(`/api/v1/categories/${testCategoryId}`)
        .send({
          name: generateUniqueName('Unauthorized Update'),
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    // Debería devolver 400 para formato de UUID inválido
    it('should return 400 for invalid UUID format', async () => {
      const response = await request(app)
        .put('/api/v1/categories/invalid-uuid-format')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: generateUniqueName('Invalid UUID Category'),
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PATCH /api/v1/categories/:id/activate|deactivate - Category Status', () => {
    beforeEach(async () => {
      // Crear categoría de test con nombre único
      const category = await createTestCategory(adminToken, {
        name: generateUniqueName('Status Test Category'),
        description: 'Category for status testing',
      });
      testCategoryId = category.id;
    });

    // Debería desactivar categoría
    it('should deactivate category', async () => {
      const response = await request(app)
        .patch(`/api/v1/categories/${testCategoryId}/deactivate`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.isActive).toBe(false);
      validateCategoryResponse(response.body.data);
    });

    // Debería activar categoría
    it('should activate category', async () => {
      // Primero desactivar
      await request(app)
        .patch(`/api/v1/categories/${testCategoryId}/deactivate`)
        .set('Authorization', `Bearer ${adminToken}`);

      // Luego activar
      const response = await request(app)
        .patch(`/api/v1/categories/${testCategoryId}/activate`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.isActive).toBe(true);
      validateCategoryResponse(response.body.data);
    });

    // Debería requerir autenticación para cambios de estado
    it('should require authentication for status changes', async () => {
      await request(app).patch(`/api/v1/categories/${testCategoryId}/deactivate`).expect(401);

      await request(app).patch(`/api/v1/categories/${testCategoryId}/activate`).expect(401);
    });

    // Debería devolver 404 para cambio de estado de categoría inexistente
    it('should return 404 for non-existent category status change', async () => {
      const response = await request(app)
        .patch('/api/v1/categories/00000000-0000-0000-0000-000000000000/deactivate')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Category not found');
    });
  });

  describe('DELETE /api/v1/categories/:id - Delete Category', () => {
    beforeEach(async () => {
      // Crear categoría de test con nombre único
      const category = await createTestCategory(adminToken, {
        name: generateUniqueName('Delete Test Category'),
        description: 'Category for deletion testing',
      });
      testCategoryId = category.id;
    });

    // Debería eliminar categoría exitosamente
    it('should delete category successfully', async () => {
      const response = await request(app)
        .delete(`/api/v1/categories/${testCategoryId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('deleted successfully');

      // Verificar que la categoría ya no existe
      await request(app).get(`/api/v1/categories/${testCategoryId}`).expect(404);
    });

    // Debería devolver 404 al eliminar categoría inexistente
    it('should return 404 when deleting non-existent category', async () => {
      const response = await request(app)
        .delete('/api/v1/categories/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Category not found');
    });

    // Debería requerir autenticación para eliminación
    it('should require authentication for deletion', async () => {
      const response = await request(app)
        .delete(`/api/v1/categories/${testCategoryId}`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Edge Cases and Validation', () => {
    // Debería manejar nombres de categoría muy largos
    it('should handle very long category names', async () => {
      const longName = 'A'.repeat(255);

      const response = await request(app)
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: longName,
          description: 'Test with very long name',
        });

      expect([201, 400]).toContain(response.status);
    });

    // Debería manejar cadenas vacías elegantemente
    it('should handle empty strings gracefully', async () => {
      const response = await request(app)
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: '',
          description: '',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    // Debería manejar valores nulos elegantemente
    it('should handle null values gracefully', async () => {
      const response = await request(app)
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: null,
          description: null,
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });
});
