module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: ['**/tests/**/*.test.ts', '**/tests/**/*.spec.ts'],

  transform: {
    '^.+\\.ts$': 'ts-jest',
  },

  // ✅ CORREGIDO: moduleNameMapper (no moduleNameMapping)
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

  // Environment
  testEnvironmentOptions: {
    NODE_ENV: 'test',
    LOG_LEVEL: 'silent',
    PRISMA_LOG_LEVEL: 'silent',
  },

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

  // ✅ REMOVIDO: jest-junit reporter (no instalado)
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
