import { Request, Response, NextFunction } from 'express';
import { errorHandler } from '../../../src/shared/middleware/ErrorHandler';
import { AppError } from '../../../src/shared/exceptions/AppError';
import { NotFoundError } from '../../../src/shared/exceptions/NotFoundError';
import { logger } from '../../../src/shared/logger/logger';

// Mockeamos el logger para verificar que ErrorHandler efectivamente registra
// los errores -- antes de este cambio, el console.error estaba comentado y
// ningun error de servidor se registraba en ningun lado.
jest.mock('../../../src/shared/logger/logger', () => ({
  logger: {
    error: jest.fn(),
  },
}));

describe('errorHandler', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let statusMock: jest.Mock;
  let jsonMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });

    mockRequest = {
      id: 'a1b2c3d4-e5f6-4789-a012-3456789abcde',
      method: 'GET',
      originalUrl: '/api/v1/appointments/123',
    };
    mockResponse = {
      status: statusMock,
    };
    mockNext = jest.fn();

    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('con AppError', () => {
    it('debería responder con el statusCode y code del error', () => {
      const error = new NotFoundError('Appointment', 'appointment-id');

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Appointment not found: appointment-id',
          code: 'NOT_FOUND',
        }),
      );
    });

    it('debería registrar el error via logger.error con contexto de la request', () => {
      const error = new AppError('Custom business error', 422, 'BUSINESS_RULE_ERROR');

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(logger.error).toHaveBeenCalledWith(
        'Custom business error',
        expect.objectContaining({
          requestId: 'a1b2c3d4-e5f6-4789-a012-3456789abcde',
          method: 'GET',
          path: '/api/v1/appointments/123',
          statusCode: 422,
          code: 'BUSINESS_RULE_ERROR',
          stack: expect.any(String),
        }),
      );
    });

    it('no debería incluir el stack en la respuesta HTTP fuera de development', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const error = new AppError('Production error', 500);
      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      const responseBody = jsonMock.mock.calls[0][0];
      expect(responseBody.stack).toBeUndefined();

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('con error genérico (no AppError)', () => {
    it('debería responder 500 con mensaje genérico', () => {
      const error = new Error('Unexpected failure');

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Internal server error',
          code: 'INTERNAL_SERVER_ERROR',
        }),
      );
    });

    it('debería registrar el error via logger.error sin statusCode/code', () => {
      const error = new Error('Unexpected failure');

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(logger.error).toHaveBeenCalledWith(
        'Unexpected failure',
        expect.objectContaining({
          method: 'GET',
          path: '/api/v1/appointments/123',
          stack: expect.any(String),
        }),
      );
      const loggedMeta = (logger.error as jest.Mock).mock.calls[0][1];
      expect(loggedMeta.statusCode).toBeUndefined();
      expect(loggedMeta.code).toBeUndefined();
    });
  });
});
