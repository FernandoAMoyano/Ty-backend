import request from 'supertest';
import app from '../../../src/app';

describe('Register Integration Tests', () => {
  describe('POST /api/v1/auth/register', () => {
    it('should register a new user successfully with default CLIENT role', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Test User',
          email: `test-${Date.now()}@example.com`,
          phone: '+1234567890',
          password: 'TestPass123!',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Test User');
      expect(response.body.data.role.name).toBe('CLIENT');
      expect(response.body.data.isActive).toBe(true);
    });

    it('should register a new user with specific role', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Stylist User',
          email: `stylist-${Date.now()}@example.com`,
          phone: '+1234567890',
          password: 'TestPass123!',
          roleName: 'STYLIST',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Stylist User');
      expect(response.body.data.role.name).toBe('STYLIST');
      expect(response.body.data.isActive).toBe(true);
    });

    it('should reject duplicate email', async () => {
      const duplicateEmail = `duplicate-${Date.now()}@example.com`;

      // Primer registro
      await request(app).post('/api/v1/auth/register').send({
        name: 'First User',
        email: duplicateEmail,
        phone: '+1234567890',
        password: 'TestPass123!',
      });

      // Segundo registro con el mismo email
      const response = await request(app).post('/api/v1/auth/register').send({
        name: 'Second User',
        email: duplicateEmail,
        phone: '+1234567891',
        password: 'TestPass123!',
      });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Email already exists');
    });

    it('should validate password requirements', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Test User',
          email: `test-password-${Date.now()}@example.com`,
          phone: '+1234567890',
          password: '123',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Password must be at least 8 characters');
    });

    it('should validate phone format', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Test User',
          email: `test-phone-${Date.now()}@example.com`,
          phone: 'invalid-phone',
          password: 'TestPass123!',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Valid phone is required');
    });

    it('should reject invalid roleName', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Invalid Role User',
          email: `invalidrole-${Date.now()}@test.com`,
          phone: '+1234567890',
          password: 'TestPass123!',
          roleName: 'INVALID_ROLE',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid role');
      expect(response.body.code).toBe('VALIDATION_ERROR');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: `test-required-${Date.now()}@example.com`,
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should validate email format in registration', async () => {
      const response = await request(app).post('/api/v1/auth/register').send({
        name: 'Test User',
        email: 'invalid-email-format',
        phone: '+1234567890',
        password: 'TestPass123!',
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Valid email is required');
    });

    it('should register with ADMIN role', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Admin User',
          email: `admin-${Date.now()}@example.com`,
          phone: '+1234567890',
          password: 'TestPass123!',
          roleName: 'ADMIN',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.role.name).toBe('ADMIN');
    });

    it('should accept roleName in different cases', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Case Test User',
          email: `case-${Date.now()}@example.com`,
          phone: '+1234567890',
          password: 'TestPass123!',
          roleName: 'client',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.role.name).toBe('CLIENT');
    });
  });
});
