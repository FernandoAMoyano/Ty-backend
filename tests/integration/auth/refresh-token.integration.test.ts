import request from 'supertest';
import app from '../../../src/app'; // Importación directa
import { loginTestUser } from '../../setup/helpers';

describe('Refresh Token Integration Tests', () => {
  describe('POST /api/v1/auth/refresh-token', () => {
    it('should refresh token with valid refresh token', async () => {
      const { refreshToken } = await loginTestUser();

      const response = await request(app).post('/api/v1/auth/refresh-token').send({ refreshToken });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
    });

    it('should reject invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh-token')
        .send({ refreshToken: 'invalid-token' });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should reject malformed refresh token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh-token')
        .send({ refreshToken: 'malformed.token.here' });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should reject empty refresh token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh-token')
        .send({ refreshToken: '' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject request without refresh token', async () => {
      const response = await request(app).post('/api/v1/auth/refresh-token').send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });
});
