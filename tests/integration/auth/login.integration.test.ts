import request from 'supertest';
import app from '../../../src/app';
import {
  setupTestDatabase,
  teardownTestDatabase,
  cleanupTestDatabase,
} from '../../setup/test-database';

describe('Login Integration Tests', () => {
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

  describe('POST /api/v1/auth/login', () => {
    it('should login with valid credentials', async () => {
      const response = await request(app).post('/api/v1/auth/login').send({
        email: 'admin@turnity.com',
        password: 'Admin123!',
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data).toHaveProperty('refreshToken');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data.user.email).toBe('admin@turnity.com');
      expect(response.body.data.user.role.name).toBe('ADMIN');
    });

    it('should reject invalid credentials', async () => {
      const response = await request(app).post('/api/v1/auth/login').send({
        email: 'admin@turnity.com',
        password: 'wrongpassword',
      });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid credentials');
    });

    it('should validate email format', async () => {
      const response = await request(app).post('/api/v1/auth/login').send({
        email: 'invalid-email',
        password: 'Admin123!',
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid email format');
    });

    it('should reject empty email', async () => {
      const response = await request(app).post('/api/v1/auth/login').send({
        email: '',
        password: 'Admin123!',
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject empty password', async () => {
      const response = await request(app).post('/api/v1/auth/login').send({
        email: 'admin@turnity.com',
        password: '',
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject login for non-existent user', async () => {
      const response = await request(app).post('/api/v1/auth/login').send({
        email: 'nonexistent@turnity.com',
        password: 'Admin123!',
      });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });
});
