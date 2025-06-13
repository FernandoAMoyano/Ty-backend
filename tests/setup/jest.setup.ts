module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],

  // IMPORTANTE: Excluir archivos de setup para que no corran como tests
  testMatch: [
    '**/tests/**/*.test.(ts|js)',
    '**/tests/**/*.spec.(ts|js)',
    '!**/tests/setup/**.*', // ✅ EXCLUIR setup
  ],

  transform: {
    '^.+\\.ts$': 'ts-jest',
  },

  setupFilesAfterEnv: ['<rootDir>/tests/setup/jest.setup.ts'],

  collectCoverageFrom: ['src/**/*.{ts,js}', '!src/**/*.d.ts'],

  testTimeout: 30000,
};
