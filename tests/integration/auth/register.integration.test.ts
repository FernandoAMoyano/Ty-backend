import request from 'supertest';
import app from '../../../src/app';
import {
  setupTestDatabase,
  teardownTestDatabase,
  cleanupTestDatabase,
} from '../../setup/test-database';

describe('Register Integration Tests', () => {
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

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user successfully', async () => {
      const response = await request(app).post('/api/v1/auth/register').send({
        name: 'Test User',
        email: 'test@example.com',
        phone: '+1234567890',
        password: 'TestPass123!',
        roleId: testData.clientRole.id,
      });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe('test@example.com');
      expect(response.body.data.name).toBe('Test User');
      expect(response.body.data.role.name).toBe('CLIENT');
      expect(response.body.data.isActive).toBe(true);
    });

    it('should reject duplicate email', async () => {
      // Primer registro
      await request(app).post('/api/v1/auth/register').send({
        name: 'First User',
        email: 'duplicate@example.com',
        phone: '+1234567890',
        password: 'TestPass123!',
        roleId: testData.clientRole.id,
      });

      // Segundo registro con el mismo email
      const response = await request(app).post('/api/v1/auth/register').send({
        name: 'Second User',
        email: 'duplicate@example.com',
        phone: '+1234567891',
        password: 'TestPass123!',
        roleId: testData.clientRole.id,
      });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Email already exists');
    });

    it('should validate password requirements', async () => {
      const response = await request(app).post('/api/v1/auth/register').send({
        name: 'Test User',
        email: 'test@example.com',
        phone: '+1234567890',
        password: '123', // Password muy simple
        roleId: testData.clientRole.id,
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Password must be at least 8 characters');
    });

    it('should validate phone format', async () => {
      const response = await request(app).post('/api/v1/auth/register').send({
        name: 'Test User',
        email: 'test@example.com',
        phone: 'invalid-phone',
        password: 'TestPass123!',
        roleId: testData.clientRole.id,
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Valid phone is required');
    });

    it('should reject invalid roleId', async () => {
      const response = await request(app).post('/api/v1/auth/register').send({
        name: 'Test User',
        email: 'test@example.com',
        phone: '+1234567890',
        password: 'TestPass123!',
        roleId: 'invalid-role-id',
      });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Role not found');
    });

    it('should validate required fields', async () => {
      const response = await request(app).post('/api/v1/auth/register').send({
        // Missing required fields
        email: 'test@example.com',
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
        roleId: testData.clientRole.id,
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Valid email is required');
    });
  });
});
