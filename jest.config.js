export const preset = 'ts-jest';
export const testEnvironment = 'node';
export const roots = ['<rootDir>/src', '<rootDir>/tests'];
export const testMatch = ['**/tests/**/*.test.ts', '**/tests/**/*.spec.ts', '**/__tests__/**/*.ts'];
export const transform = {
  '^.+\\.ts$': 'ts-jest',
};

export const coverageDirectory = 'coverage';
export const coverageReporters = [
  'text', // Para ver en consola
  'text-summary', // Resumen en consola
  'lcov', // Para herramientas como Codecov
  'html', // Para ver reporte web local
  'json', // Para CI/CD
];
export const coverageThreshold = {
  global: {
    branches: 75, // 75% de ramas cubiertas
    functions: 80, // 80% de funciones cubiertas
    lines: 80, // 80% de líneas cubiertas
    statements: 80, // 80% de declaraciones cubiertas
  },
  // Umbrales específicos para módulos críticos
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
};
export const setupFilesAfterEnv = ['<rootDir>/tests/setup/jest.setup.ts'];
export const testTimeout = 30000;
export const moduleNameMapping = {
  '^@/(.*)$': '<rootDir>/src/$1',
  '^@shared/(.*)$': '<rootDir>/src/shared/$1',
  '^@modules/(.*)$': '<rootDir>/src/modules/$1',
  '^@auth/(.*)$': '<rootDir>/src/modules/auth/$1',
  '^@services/(.*)$': '<rootDir>/src/modules/services/$1',
  '^@tests/(.*)$': '<rootDir>/tests/$1',
};
export const testEnvironmentOptions = {
  NODE_ENV: 'test',
};
export const testPathIgnorePatterns = [
  '/node_modules/',
  '/dist/',
  '/coverage/',
  '/prisma/migrations/',
  '/.next/',
  '/build/',
];
export const clearMocks = true;
export const resetMocks = true;
export const verbose = true;
export const detectOpenHandles = true;
export const forceExit = true;
export const projects = [
  // Tests unitarios
  {
    displayName: {
      name: 'UNIT',
      color: 'blue',
    },
    testMatch: ['<rootDir>/tests/unit/**/*.test.ts'],
    coverageDirectory: '<rootDir>/coverage/unit',
    testEnvironment: 'node',
  },

  // Tests de integración
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

  // Tests E2E
  {
    displayName: {
      name: 'E2E',
      color: 'green',
    },
    testMatch: ['<rootDir>/tests/e2e/**/*.test.ts'],
    coverageDirectory: '<rootDir>/coverage/e2e',
    testEnvironment: 'node',
    testTimeout: 60000, // E2E tests necesitan más tiempo
    setupFilesAfterEnv: [
      '<rootDir>/tests/setup/jest.setup.ts',
      '<rootDir>/tests/setup/test-database.ts',
    ],
  },
];

export const globals = {
  'ts-jest': {
    tsconfig: 'tsconfig.json',
    isolatedModules: true, // Mejor performance
  },
};
export const moduleFileExtensions = ['ts', 'js', 'json', 'node'];
export const reporters = [
  'default',
  [
    'jest-junit',
    {
      outputDirectory: './coverage',
      outputName: 'junit.xml',
      suiteName: 'Turnity Backend Tests',
    },
  ],
];
export const collectCoverageFrom = [
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

  // Excluir archivos específicos de Turnity
  '!src/**/*.container.ts',
  '!src/**/*.routes.ts', // Routes son mayormente configuración
  '!src/**/seed.ts',
  '!src/**/migrations/**',
];
