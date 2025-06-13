import request from 'supertest';
import app from '../../../src/app';

import { RoleName } from '@prisma/client';
import { testPrisma } from '../../setup/database';

describe('Register Integration Tests', () => {
  let clientRoleId: string;

  beforeAll(async () => {
    // Obtener el role ID del seed
    const clientRole = await testPrisma.role.findFirst({
      where: { name: RoleName.CLIENT },
    });

    if (!clientRole) {
      throw new Error('Client role not found. Run seed first.');
    }

    clientRoleId = clientRole.id;
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user successfully', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Test User',
          email: `test-${Date.now()}@example.com`, // Email único
          phone: '+1234567890',
          password: 'TestPass123!',
          roleId: clientRoleId, // Usar roleId real
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);

      expect(response.body.data.name).toBe('Test User');
      expect(response.body.data.role.name).toBe('CLIENT');
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
        roleId: clientRoleId,
      });

      // Segundo registro con el mismo email
      const response = await request(app).post('/api/v1/auth/register').send({
        name: 'Second User',
        email: duplicateEmail,
        phone: '+1234567891',
        password: 'TestPass123!',
        roleId: clientRoleId,
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
          password: '123', // Password muy simple
          roleId: clientRoleId,
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
          roleId: clientRoleId,
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Valid phone is required');
    });

    it('should reject invalid roleId', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Test User',
          email: `test-role-${Date.now()}@example.com`,
          phone: '+1234567890',
          password: 'TestPass123!',
          roleId: 'invalid-role-id',
        });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Role not found');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          // Missing required fields
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
        roleId: clientRoleId,
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Valid email is required');
    });
  });
});
