export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: ['**/tests/**/*.test.ts', '**/tests/**/*.spec.ts', '**/__tests__/**/*.ts'],

  transform: {
    '^.+\\.ts$': 'ts-jest',
  },

  // Performance optimizations
  maxWorkers: '50%',
  cacheDirectory: '<rootDir>/.jest-cache',

  // Coverage configuration
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'text-summary', 'lcov', 'html', 'json'],

  coverageThreshold: {
    global: {
      branches: 75,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    './src/modules/auth/': {
      branches: 85,
      functions: 90,
      lines: 90,
      statements: 90,
    },
    './src/modules/services/': {
      branches: 80,
      functions: 85,
      lines: 85,
      statements: 85,
    },
  },

  // Setup and teardown
  setupFilesAfterEnv: ['<rootDir>/tests/setup/jest.setup.ts'],
  testTimeout: 30000,

  // Module resolution
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@shared/(.*)$': '<rootDir>/src/shared/$1',
    '^@modules/(.*)$': '<rootDir>/src/modules/$1',
    '^@auth/(.*)$': '<rootDir>/src/modules/auth/$1',
    '^@services/(.*)$': '<rootDir>/src/modules/services/$1',
    '^@tests/(.*)$': '<rootDir>/tests/$1',
  },

  // Test environment
  testEnvironmentOptions: {
    NODE_ENV: 'test',
  },

  // Ignore patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/coverage/',
    '/prisma/migrations/',
    '/.next/',
    '/build/',
  ],

  // Mock configuration
  clearMocks: true,
  resetMocks: true,

  // Output configuration
  verbose: true,
  detectOpenHandles: true,
  forceExit: true,

  // Multi-project configuration
  projects: [
    // Unit tests
    {
      displayName: {
        name: 'UNIT',
        color: 'blue',
      },
      testMatch: ['<rootDir>/tests/unit/**/*.test.ts'],
      coverageDirectory: '<rootDir>/coverage/unit',
      testEnvironment: 'node',
    },

    // Integration tests
    {
      displayName: {
        name: 'INTEGRATION',
        color: 'yellow',
      },
      testMatch: ['<rootDir>/tests/integration/**/*.test.ts'],
      coverageDirectory: '<rootDir>/coverage/integration',
      testEnvironment: 'node',
      setupFilesAfterEnv: [
        '<rootDir>/tests/setup/jest.setup.ts',
        '<rootDir>/tests/setup/test-database.ts',
      ],
    },

    // E2E tests
    {
      displayName: {
        name: 'E2E',
        color: 'green',
      },
      testMatch: ['<rootDir>/tests/e2e/**/*.test.ts'],
      coverageDirectory: '<rootDir>/coverage/e2e',
      testEnvironment: 'node',
      testTimeout: 60000,
      setupFilesAfterEnv: [
        '<rootDir>/tests/setup/jest.setup.ts',
        '<rootDir>/tests/setup/test-database.ts',
      ],
    },
  ],

  // TypeScript configuration
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json',
      isolatedModules: true,
    },
  },

  moduleFileExtensions: ['ts', 'js', 'json', 'node'],

  // Reporting
  reporters: [
    'default',
    [
      'jest-junit',
      {
        outputDirectory: './coverage',
        outputName: 'junit.xml',
        suiteName: 'Turnity Backend Tests',
      },
    ],
  ],

  // Coverage collection
  collectCoverageFrom: [
    // Auth Module
    'src/modules/auth/domain/**/*.ts',
    'src/modules/auth/application/**/*.ts',
    'src/modules/auth/infrastructure/**/*.ts',
    '!src/modules/auth/infrastructure/config/**',

    // Services Module
    'src/modules/services/domain/**/*.ts',
    'src/modules/services/application/**/*.ts',
    'src/modules/services/infrastructure/**/*.ts',
    '!src/modules/services/infrastructure/config/**',

    // Shared
    'src/shared/**/*.ts',
    '!src/shared/config/**',
    '!src/shared/types/**',

    // General exclusions
    '!src/**/*.container.ts',
    '!src/**/*.routes.ts',
    '!src/**/seed.ts',
    '!src/**/migrations/**',
    '!src/**/*.d.ts',
    '!src/**/*.interface.ts',
    '!src/**/*.type.ts',
    '!src/**/index.ts',
    '!src/**/*.mock.ts',
  ],
};
