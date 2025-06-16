import request from 'supertest';
import app from '../../../src/app';

describe('Profile Integration Tests', () => {
  describe('GET /api/v1/auth/profile', () => {
    it('should get user profile with valid token', async () => {
      // ✅ CAMBIO: Crear un usuario nuevo para este test específico
      const registerResponse = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Profile Test User',
          email: `profile-test-${Date.now()}@example.com`, // Email único
          phone: '+1234567890',
          password: 'TestPass123!',
          roleName: 'CLIENT',
        });

      expect(registerResponse.status).toBe(201);

      // Login para obtener token
      const loginResponse = await request(app).post('/api/v1/auth/login').send({
        email: registerResponse.body.data.email,
        password: 'TestPass123!',
      });

      expect(loginResponse.status).toBe(200);
      const validToken = loginResponse.body.data.token;

      // Obtener perfil
      const response = await request(app)
        .get('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe(registerResponse.body.data.email);
      expect(response.body.data.name).toBe('Profile Test User'); // ✅ Nombre que sabemos que tiene
      expect(response.body.data.role.name).toBe('CLIENT');
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('phone');
      expect(response.body.data).toHaveProperty('createdAt');
      expect(response.body.data).toHaveProperty('updatedAt');
    });

    it('should reject access without token', async () => {
      const response = await request(app).get('/api/v1/auth/profile');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should reject access with invalid token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/profile')
        .set('Authorization', 'Bearer invalid.token.here');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/v1/auth/profile', () => {
    it('should update user profile successfully', async () => {
      // Crear usuario específico para este test
      const registerResponse = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Update Test User',
          email: `update-test-${Date.now()}@example.com`,
          phone: '+1234567890',
          password: 'TestPass123!',
          roleName: 'CLIENT',
        });

      // Login
      const loginResponse = await request(app).post('/api/v1/auth/login').send({
        email: registerResponse.body.data.email,
        password: 'TestPass123!',
      });

      const validToken = loginResponse.body.data.token;

      // Actualizar perfil
      const updateData = {
        name: 'Updated Name',
        phone: '+9876543210',
      };

      const updateResponse = await request(app)
        .put('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${validToken}`)
        .send(updateData);

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.success).toBe(true);
      expect(updateResponse.body.data.name).toBe('Updated Name');
      expect(updateResponse.body.data.phone).toBe('+9876543210');
      expect(updateResponse.body.data.email).toBe(registerResponse.body.data.email); // Email no cambia
    });

    it('should get updated profile after update', async () => {
      // Crear usuario específico para este test
      const registerResponse = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Get Updated Test User',
          email: `get-updated-${Date.now()}@example.com`,
          phone: '+1234567890',
          password: 'TestPass123!',
          roleName: 'CLIENT',
        });

      // Login
      const loginResponse = await request(app).post('/api/v1/auth/login').send({
        email: registerResponse.body.data.email,
        password: 'TestPass123!',
      });

      const validToken = loginResponse.body.data.token;

      // Primero actualizar
      await request(app)
        .put('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          name: 'Finally Updated Name',
          phone: '+9876543210',
        });

      // Luego verificar que se actualizó
      const response = await request(app)
        .get('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.name).toBe('Finally Updated Name'); // ✅ Ahora debería ser el nombre actualizado
      expect(response.body.data.phone).toBe('+9876543210');
    });

    it('should update profile with partial data', async () => {
      // Crear usuario específico para este test
      const registerResponse = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Partial Test User',
          email: `partial-${Date.now()}@example.com`,
          phone: '+1234567890',
          password: 'TestPass123!',
          roleName: 'CLIENT',
        });

      // Login
      const loginResponse = await request(app).post('/api/v1/auth/login').send({
        email: registerResponse.body.data.email,
        password: 'TestPass123!',
      });

      const validToken = loginResponse.body.data.token;

      // Actualizar solo nombre
      const response = await request(app)
        .put('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          name: 'Partial Update Name',
          // Solo enviar name, no phone
        });

      expect(response.status).toBe(200);
      expect(response.body.data.name).toBe('Partial Update Name');
      // phone debería mantenerse igual
    });

    it('should reject profile update without token', async () => {
      const response = await request(app).put('/api/v1/auth/profile').send({
        name: 'Should Fail',
      });

      expect(response.status).toBe(401);
    });

    it('should reject profile update with invalid data', async () => {
      // Crear usuario específico para este test
      const registerResponse = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Invalid Test User',
          email: `invalid-${Date.now()}@example.com`,
          phone: '+1234567890',
          password: 'TestPass123!',
          roleName: 'CLIENT',
        });

      // Login
      const loginResponse = await request(app).post('/api/v1/auth/login').send({
        email: registerResponse.body.data.email,
        password: 'TestPass123!',
      });

      const validToken = loginResponse.body.data.token;

      const response = await request(app)
        .put('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          name: '', // Nombre vacío debería fallar
          phone: 'invalid-phone',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });
});
