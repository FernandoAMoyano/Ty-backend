import request from 'supertest';
import app from '../../../src/app';
import {
  setupTestDatabase,
  teardownTestDatabase,
  cleanupTestDatabase,
} from '../../setup/test-database';
import { createTestUser, loginTestUser } from '../../setup/test-helpers';

describe('Change Password Integration Tests', () => {
  let testData: any;

  beforeAll(async () => {
    testData = await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  afterEach(async () => {
    await cleanupTestDatabase();
  });

  describe('PUT /api/v1/auth/change-password', () => {
    it('should change password with valid current password', async () => {
      // Crear usuario de test
      const testUser = await createTestUser(testData.clientRole.id, 'changepass@example.com');
      const loginResult = await loginTestUser('changepass@example.com', 'TestPass123!');

      const response = await request(app)
        .put('/api/v1/auth/change-password')
        .set('Authorization', `Bearer ${loginResult.token}`)
        .send({
          currentPassword: 'TestPass123!',
          newPassword: 'NewSecurePass456!',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Password changed successfully');

      // Verificar que puede loguearse con la nueva password
      const newLoginResponse = await request(app).post('/api/v1/auth/login').send({
        email: 'changepass@example.com',
        password: 'NewSecurePass456!',
      });

      expect(newLoginResponse.status).toBe(200);

      // Verificar que no puede loguearse con la password antigua
      const oldLoginResponse = await request(app).post('/api/v1/auth/login').send({
        email: 'changepass@example.com',
        password: 'TestPass123!',
      });

      expect(oldLoginResponse.status).toBe(401);
    });

    it('should reject wrong current password', async () => {
      const testUser = await createTestUser(testData.clientRole.id, 'wrongpass@example.com');
      const loginResult = await loginTestUser('wrongpass@example.com', 'TestPass123!');

      const response = await request(app)
        .put('/api/v1/auth/change-password')
        .set('Authorization', `Bearer ${loginResult.token}`)
        .send({
          currentPassword: 'WrongCurrentPass!',
          newPassword: 'NewSecurePass456!',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Current password is incorrect');
    });

    it('should validate new password requirements', async () => {
      const testUser = await createTestUser(testData.clientRole.id, 'weakpass@example.com');
      const loginResult = await loginTestUser('weakpass@example.com', 'TestPass123!');

      const response = await request(app)
        .put('/api/v1/auth/change-password')
        .set('Authorization', `Bearer ${loginResult.token}`)
        .send({
          currentPassword: 'TestPass123!',
          newPassword: '123', // Password muy débil
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('New password must be at least 8 characters');
    });

    it('should reject change password without authentication', async () => {
      const response = await request(app).put('/api/v1/auth/change-password').send({
        currentPassword: 'TestPass123!',
        newPassword: 'NewSecurePass456!',
      });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should reject request with missing fields', async () => {
      const testUser = await createTestUser(testData.clientRole.id, 'missing@example.com');
      const loginResult = await loginTestUser('missing@example.com', 'TestPass123!');

      const response = await request(app)
        .put('/api/v1/auth/change-password')
        .set('Authorization', `Bearer ${loginResult.token}`)
        .send({
          currentPassword: 'TestPass123!',
          // Missing newPassword
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });
});
