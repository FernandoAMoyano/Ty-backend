import { validateEnv } from '../../../src/shared/config/env';

describe('validateEnv', () => {
  const validEnv = {
    JWT_ACCESS_SECRET: 'a'.repeat(32),
    JWT_REFRESH_SECRET: 'b'.repeat(32),
    DATABASE_URL: 'postgresql://user:pass@localhost:5432/turnity?schema=public',
  };

  let exitSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => undefined as never);
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    exitSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('con variables válidas', () => {
    it('debería parsear correctamente sin llamar a process.exit', () => {
      const result = validateEnv(validEnv);

      expect(exitSpy).not.toHaveBeenCalled();
      expect(result.JWT_ACCESS_SECRET).toBe(validEnv.JWT_ACCESS_SECRET);
      expect(result.DATABASE_URL).toBe(validEnv.DATABASE_URL);
    });

    it('debería aplicar los defaults de las variables opcionales', () => {
      const result = validateEnv(validEnv);

      expect(result.NODE_ENV).toBe('development');
      expect(result.PORT).toBe(3000);
      expect(result.LOG_LEVEL).toBe('info');
      expect(result.JWT_ACCESS_EXPIRY).toBe('15m');
      expect(result.JWT_REFRESH_EXPIRY).toBe('7d');
      expect(result.FRONTEND_URL).toBe('http://localhost:3000');
    });

    it('debería respetar los valores explícitos de las variables opcionales en vez del default', () => {
      const result = validateEnv({
        ...validEnv,
        NODE_ENV: 'production',
        PORT: '8080',
        LOG_LEVEL: 'debug',
        JWT_ACCESS_EXPIRY: '1h',
        FRONTEND_URL: 'https://turnity.com',
      });

      expect(result.NODE_ENV).toBe('production');
      expect(result.PORT).toBe(8080);
      expect(result.LOG_LEVEL).toBe('debug');
      expect(result.JWT_ACCESS_EXPIRY).toBe('1h');
      expect(result.FRONTEND_URL).toBe('https://turnity.com');
    });
  });

  describe('con variables requeridas faltantes o inválidas', () => {
    it('debería llamar a process.exit(1) si falta JWT_ACCESS_SECRET', () => {
      const { JWT_ACCESS_SECRET, ...rest } = validEnv;
      void JWT_ACCESS_SECRET;

      validateEnv(rest);

      expect(exitSpy).toHaveBeenCalledWith(1);
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('debería llamar a process.exit(1) si JWT_ACCESS_SECRET tiene menos de 32 caracteres', () => {
      validateEnv({ ...validEnv, JWT_ACCESS_SECRET: 'demasiado-corto' });

      expect(exitSpy).toHaveBeenCalledWith(1);
    });

    it('debería llamar a process.exit(1) si falta DATABASE_URL', () => {
      const { DATABASE_URL, ...rest } = validEnv;
      void DATABASE_URL;

      validateEnv(rest);

      expect(exitSpy).toHaveBeenCalledWith(1);
    });

    it('debería llamar a process.exit(1) si DATABASE_URL no es una URL válida', () => {
      validateEnv({ ...validEnv, DATABASE_URL: 'no-es-una-url' });

      expect(exitSpy).toHaveBeenCalledWith(1);
    });

    it('debería llamar a process.exit(1) si NODE_ENV tiene un valor fuera del enum', () => {
      validateEnv({ ...validEnv, NODE_ENV: 'staging' });

      expect(exitSpy).toHaveBeenCalledWith(1);
    });

    it('debería llamar a process.exit(1) si PORT no es un número de puerto válido', () => {
      validateEnv({ ...validEnv, PORT: 'not-a-number' });

      expect(exitSpy).toHaveBeenCalledWith(1);
    });

    it('debería llamar a process.exit(1) si JWT_ACCESS_EXPIRY no matchea el formato esperado', () => {
      validateEnv({ ...validEnv, JWT_ACCESS_EXPIRY: '2 days' });

      expect(exitSpy).toHaveBeenCalledWith(1);
    });

    it('debería imprimir un mensaje legible por cada variable inválida', () => {
      validateEnv({});

      const printedMessages = consoleErrorSpy.mock.calls.map((call) => call[0]).join('\n');
      expect(printedMessages).toContain('JWT_ACCESS_SECRET');
      expect(printedMessages).toContain('JWT_REFRESH_SECRET');
      expect(printedMessages).toContain('DATABASE_URL');
    });
  });
});
