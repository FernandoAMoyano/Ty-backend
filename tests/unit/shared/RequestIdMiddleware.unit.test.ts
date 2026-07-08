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

  it('debería asignar un UUID v4 válido a req.id', () => {
    requestIdMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockRequest.id).toBeDefined();
    expect(mockRequest.id).toMatch(UUID_V4_REGEX);
  });

  it('debería exponer el mismo ID como header X-Request-Id de la respuesta', () => {
    requestIdMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

    expect(setHeaderMock).toHaveBeenCalledWith('X-Request-Id', mockRequest.id);
  });

  it('debería llamar a next() sin argumentos', () => {
    requestIdMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockNext).toHaveBeenCalledWith();
  });

  it('debería generar un ID distinto en cada request', () => {
    const firstRequest: Partial<Request> = {};
    const secondRequest: Partial<Request> = {};

    requestIdMiddleware(firstRequest as Request, mockResponse as Response, mockNext);
    requestIdMiddleware(secondRequest as Request, mockResponse as Response, mockNext);

    expect(firstRequest.id).not.toBe(secondRequest.id);
  });
});
