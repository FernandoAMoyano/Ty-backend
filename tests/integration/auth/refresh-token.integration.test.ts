import request from 'supertest';
import app from '../../../src/app';
import {
  setupTestDatabase,
  teardownTestDatabase,
  cleanupTestDatabase,
} from '../../setup/test-database';
import { loginTestUser } from '../../setup/test-helpers';

describe('Refresh Token Integration Tests', () => {
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

  describe('POST /api/v1/auth/refresh-token', () => {
    it('should refresh token with valid refresh token', async () => {
      // Login para obtener refresh token
      const loginResult = await loginTestUser('admin@turnity.com', 'Admin123!');

      const response = await request(app).post('/api/v1/auth/refresh-token').send({
        refreshToken: loginResult.refreshToken,
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data).toHaveProperty('refreshToken');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data.user.email).toBe('admin@turnity.com');

      // El nuevo token debe ser diferente al original
      expect(response.body.data.token).not.toBe(loginResult.token);
      expect(response.body.data.refreshToken).not.toBe(loginResult.refreshToken);
    });

    it('should reject invalid refresh token', async () => {
      const response = await request(app).post('/api/v1/auth/refresh-token').send({
        refreshToken: 'invalid.refresh.token',
      });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid refresh token');
    });

    it('should reject malformed refresh token', async () => {
      const response = await request(app).post('/api/v1/auth/refresh-token').send({
        refreshToken: 'malformed-token',
      });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should reject empty refresh token', async () => {
      const response = await request(app).post('/api/v1/auth/refresh-token').send({
        refreshToken: '',
      });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should reject request without refresh token', async () => {
      const response = await request(app).post('/api/v1/auth/refresh-token').send({});

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });
});
