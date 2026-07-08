import express, { Express } from 'express';
import request from 'supertest';
import { rateLimit } from 'express-rate-limit';
import { errorHandler } from '../../../src/shared/middleware/ErrorHandler';
import {
  loginRateLimiterOptions,
  registerRateLimiterOptions,
  refreshTokenRateLimiterOptions,
} from '../../../src/shared/middleware/RateLimiter';

// Mockeamos el logger para que ErrorHandler no intente escribir a disco/consola
// durante este test (y para no depender de si NODE_ENV termina siendo 'test' o no
// en el momento exacto en que se carga el modulo del logger).
jest.mock('../../../src/shared/logger/logger', () => ({
  logger: { error: jest.fn() },
}));

/**
 * Construye una app de Express minima con un rate limiter fresco montado,
 * usando exactamente las mismas opciones que produccion (importadas desde
 * RateLimiter.ts), pero con una instancia nueva de express-rate-limit --
 * evita que el estado interno (contador por IP) se filtre entre tests.
 *
 * La ruta de prueba responde 200 por defecto, o el status indicado en
 * `?status=` para simular intentos fallidos (relevante para probar
 * skipSuccessfulRequests).
 */
const buildTestApp = (options: Parameters<typeof rateLimit>[0]): Express => {
  const app = express();
  app.use(rateLimit(options));
  app.post('/test', (req, res) => {
    const status = Number(req.query.status) || 200;
    res.status(status).json({ success: status < 400 });
  });
  app.use(errorHandler);
  return app;
};

describe('RateLimiter', () => {
  const originalNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  describe('en NODE_ENV=test (comportamiento normal de la suite)', () => {
    it('no debería bloquear ni siquiera superando el límite configurado', async () => {
      process.env.NODE_ENV = 'test';
      const app = buildTestApp({ ...loginRateLimiterOptions, limit: 2 });

      await request(app).post('/test');
      await request(app).post('/test');
      const thirdResponse = await request(app).post('/test');

      expect(thirdResponse.status).toBe(200);
    });
  });

  describe('loginRateLimiter (fuera de NODE_ENV=test)', () => {
    it('debería permitir hasta el límite configurado (5) y bloquear el siguiente con 429', async () => {
      process.env.NODE_ENV = 'production';
      const app = buildTestApp({ ...loginRateLimiterOptions });

      for (let i = 0; i < 5; i++) {
        const response = await request(app).post('/test').query({ status: 401 });
        expect(response.status).toBe(401);
      }

      const sixthResponse = await request(app).post('/test').query({ status: 401 });

      expect(sixthResponse.status).toBe(429);
      expect(sixthResponse.body).toEqual(
        expect.objectContaining({
          success: false,
          code: 'TOO_MANY_REQUESTS',
        }),
      );
    });

    it('no debería contar los intentos exitosos (skipSuccessfulRequests)', async () => {
      process.env.NODE_ENV = 'production';
      const app = buildTestApp({ ...loginRateLimiterOptions });

      // 10 logins exitosos, el doble del límite -- ninguno deberia bloquearse
      for (let i = 0; i < 10; i++) {
        const response = await request(app).post('/test').query({ status: 200 });
        expect(response.status).toBe(200);
      }
    });
  });

  describe('registerRateLimiter (fuera de NODE_ENV=test)', () => {
    it('debería bloquear con 429 tras superar el límite configurado (10), contando también los exitosos', async () => {
      process.env.NODE_ENV = 'production';
      const app = buildTestApp({ ...registerRateLimiterOptions });

      for (let i = 0; i < 10; i++) {
        const response = await request(app).post('/test').query({ status: 201 });
        expect(response.status).toBe(201);
      }

      const eleventhResponse = await request(app).post('/test').query({ status: 201 });

      expect(eleventhResponse.status).toBe(429);
      expect(eleventhResponse.body.code).toBe('TOO_MANY_REQUESTS');
    });
  });

  describe('refreshTokenRateLimiter (fuera de NODE_ENV=test)', () => {
    it('debería bloquear con 429 tras superar el límite configurado (20)', async () => {
      process.env.NODE_ENV = 'production';
      const app = buildTestApp({ ...refreshTokenRateLimiterOptions });

      for (let i = 0; i < 20; i++) {
        const response = await request(app).post('/test').query({ status: 200 });
        expect(response.status).toBe(200);
      }

      const extraResponse = await request(app).post('/test').query({ status: 200 });

      expect(extraResponse.status).toBe(429);
    });
  });
});
