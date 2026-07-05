module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: ['**/tests/**/*.test.ts', '**/tests/**/*.spec.ts'],

  transform: {
    '^.+\\.ts$': 'ts-jest',
  },

  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@shared/(.*)$': '<rootDir>/src/shared/$1',
    '^@modules/(.*)$': '<rootDir>/src/modules/$1',
    '^@auth/(.*)$': '<rootDir>/src/modules/auth/$1',
    '^@services/(.*)$': '<rootDir>/src/modules/services/$1',
    '^@tests/(.*)$': '<rootDir>/tests/$1',
  },

  // Coverage básico
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],

  // Setup
  setupFilesAfterEnv: ['<rootDir>/tests/setup/jest.setup.ts'],
  testTimeout: 30000,

  // NOTA: testEnvironmentOptions NO setea process.env -- se pasa al constructor
  // del entorno de test (sandbox de jest-environment-node), no al proceso real.
  // NODE_ENV=test se fuerza correctamente en tests/setup/jest.setup.ts en su lugar.

  // Ignore patterns
  testPathIgnorePatterns: ['/node_modules/', '/dist/', '/coverage/', '/prisma/migrations/'],

  // Mock configuration
  clearMocks: true,
  resetMocks: true,
  verbose: false,
  detectOpenHandles: true,
  forceExit: true,

  // TypeScript configuration
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json',
      isolatedModules: true,
    },
  },

  moduleFileExtensions: ['ts', 'js', 'json', 'node'],

  reporters: ['default'],

  // Coverage collection
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/server.ts',
    '!src/app.ts',
    '!src/**/*.config.ts',
    '!src/**/migrations/**',
  ],
};
