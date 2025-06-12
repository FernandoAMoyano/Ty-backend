import request from 'supertest';
import app from '../../../src/app';
import { loginTestUser } from '../../setup/helpers';

describe('Change Password Integration Tests', () => {
  describe('PUT /api/v1/auth/change-password', () => {
    it('should change password with valid current password', async () => {
      // Crear usuario de test y hacer login
      const loginResult = await loginTestUser(); // ✅ Sin parámetros

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
        email: loginResult.user.email, // ✅ Email del resultado del login
        password: 'NewSecurePass456!',
      });

      expect(newLoginResponse.status).toBe(200);

      // Verificar que no puede loguearse con la password antigua
      const oldLoginResponse = await request(app).post('/api/v1/auth/login').send({
        email: loginResult.user.email, // ✅ Email del resultado del login
        password: 'TestPass123!',
      });

      expect(oldLoginResponse.status).toBe(401);
    });

    it('should reject wrong current password', async () => {
      const loginResult = await loginTestUser(); // ✅ Sin parámetros

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
      const loginResult = await loginTestUser(); // ✅ Sin parámetros

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
      const loginResult = await loginTestUser(); // ✅ Sin parámetros

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
