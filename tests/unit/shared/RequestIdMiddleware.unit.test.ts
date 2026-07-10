import { Request, Response, NextFunction } from 'express';
import { requestIdMiddleware } from '../../../src/shared/middleware/RequestIdMiddleware';

describe('requestIdMiddleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let setHeaderMock: jest.Mock;

  const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  beforeEach(() => {
    setHeaderMock = jest.fn();
    mockRequest = {};
    mockResponse = { setHeader: setHeaderMock };
    mockNext = jest.fn();
  });

  // Debería asignar un UUID v4 válido a req.id
  it('should assign a valid UUID v4 to req.id', () => {
    requestIdMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockRequest.id).toBeDefined();
    expect(mockRequest.id).toMatch(UUID_V4_REGEX);
  });

  // Debería exponer el mismo ID como header X-Request-Id de la respuesta
  it('should expose the same ID as the X-Request-Id response header', () => {
    requestIdMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

    expect(setHeaderMock).toHaveBeenCalledWith('X-Request-Id', mockRequest.id);
  });

  // Debería llamar a next() sin argumentos
  it('should call next() without arguments', () => {
    requestIdMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockNext).toHaveBeenCalledWith();
  });

  // Debería generar un ID distinto en cada request
  it('should generate a different ID on each request', () => {
    const firstRequest: Partial<Request> = {};
    const secondRequest: Partial<Request> = {};

    requestIdMiddleware(firstRequest as Request, mockResponse as Response, mockNext);
    requestIdMiddleware(secondRequest as Request, mockResponse as Response, mockNext);

    expect(firstRequest.id).not.toBe(secondRequest.id);
  });
});
