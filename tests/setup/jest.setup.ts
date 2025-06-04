import { testPrisma } from './test-database';

// Global test setup
beforeAll(async () => {
  // Set test environment
  process.env.NODE_ENV = 'test';
  process.env.JWT_ACCESS_SECRET = 'test-jwt-access-secret';
  process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret';
});

afterAll(async () => {
  await testPrisma.$disconnect();
});

// Increase timeout for integration tests
jest.setTimeout(30000);
