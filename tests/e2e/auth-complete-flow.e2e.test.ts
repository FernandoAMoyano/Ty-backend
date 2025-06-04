import request from 'supertest';
import app from '../../src/app';
import { setupTestDatabase, teardownTestDatabase } from '../setup/test-database';

describe('Auth Complete Flow E2E Tests', () => {
  let testData: any;

  beforeAll(async () => {
    testData = await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  it('should complete full authentication flow', async () => {
    // 1. Register new user
    const registerResponse = await request(app).post('/api/v1/auth/register').send({
      name: 'E2E Test User',
      email: 'e2e@example.com',
      phone: '+1234567890',
      password: 'E2ETest123!',
      roleId: testData.clientRole.id,
    });

    expect(registerResponse.status).toBe(201);
    const registeredUser = registerResponse.body.data;

    // 2. Login with new user
    const loginResponse = await request(app).post('/api/v1/auth/login').send({
      email: 'e2e@example.com',
      password: 'E2ETest123!',
    });

    expect(loginResponse.status).toBe(200);
    const { token, refreshToken } = loginResponse.body.data;

    // 3. Get profile
    const profileResponse = await request(app)
      .get('/api/v1/auth/profile')
      .set('Authorization', `Bearer ${token}`);

    expect(profileResponse.status).toBe(200);
    expect(profileResponse.body.data.email).toBe('e2e@example.com');

    // 4. Update profile
    const updateResponse = await request(app)
      .put('/api/v1/auth/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Updated E2E User',
        phone: '+9876543210',
      });

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.data.name).toBe('Updated E2E User');

    // 5. Change password
    const changePasswordResponse = await request(app)
      .put('/api/v1/auth/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({
        currentPassword: 'E2ETest123!',
        newPassword: 'NewE2ETest456!',
      });

    expect(changePasswordResponse.status).toBe(200);

    // 6. Login with new password
    const newLoginResponse = await request(app).post('/api/v1/auth/login').send({
      email: 'e2e@example.com',
      password: 'NewE2ETest456!',
    });

    expect(newLoginResponse.status).toBe(200);

    // 7. Refresh token
    const refreshResponse = await request(app)
      .post('/api/v1/auth/refresh-token')
      .send({ refreshToken });

    expect(refreshResponse.status).toBe(200);
    expect(refreshResponse.body.data.token).toBeDefined();
    expect(refreshResponse.body.data.refreshToken).toBeDefined();

    // 8. Verify old password doesn't work
    const oldPasswordResponse = await request(app).post('/api/v1/auth/login').send({
      email: 'e2e@example.com',
      password: 'E2ETest123!',
    });

    expect(oldPasswordResponse.status).toBe(401);
  });

  it('should handle complete error scenarios', async () => {
    // Test complete error flow
    const invalidLoginResponse = await request(app).post('/api/v1/auth/login').send({
      email: 'nonexistent@example.com',
      password: 'WrongPassword123!',
    });

    expect(invalidLoginResponse.status).toBe(401);

    // Test profile access without token
    const unauthorizedProfileResponse = await request(app).get('/api/v1/auth/profile');

    expect(unauthorizedProfileResponse.status).toBe(401);

    // Test invalid token
    const invalidTokenResponse = await request(app)
      .get('/api/v1/auth/profile')
      .set('Authorization', 'Bearer invalid.token');

    expect(invalidTokenResponse.status).toBe(401);
  });
});
