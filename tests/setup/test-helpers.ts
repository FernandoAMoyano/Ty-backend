import request from 'supertest';
import app from '../../src/app';

export const loginAsAdmin = async () => {
  const response = await request(app).post('/api/v1/auth/login').send({
    email: 'admin@turnity.com',
    password: 'Admin123!',
  });

  return response.body.data.token;
};

export const createTestUser = async (roleId: string, email: string = 'test@example.com') => {
  const response = await request(app).post('/api/v1/auth/register').send({
    name: 'Test User',
    email,
    phone: '+1234567890',
    password: 'TestPass123!',
    roleId,
  });

  return response.body.data;
};

export const loginTestUser = async (email: string, password: string) => {
  const response = await request(app).post('/api/v1/auth/login').send({ email, password });

  return {
    token: response.body.data.token,
    refreshToken: response.body.data.refreshToken,
    user: response.body.data.user,
  };
};
