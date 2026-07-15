import { Response } from 'express';
import {
  AuthMiddleware,
  AuthenticatedRequest,
} from '../../../src/modules/auth/presentation/middleware/AuthMiddleware';
import { JwtService } from '../../../src/modules/auth/application/services/JwtService';
import { IRoleRepository } from '../../../src/modules/auth/domain/repositories/IRoleRepository';
import { Role } from '../../../src/modules/auth/domain/entities/Role';
import { UnauthorizedError } from '../../../src/shared/exceptions/UnauthorizedError';
import { ForbiddenError } from '../../../src/shared/exceptions/ForbiddenError';
import { generateUuid } from '../../../src/shared/utils/uuid';

describe('AuthMiddleware.authorize (F15)', () => {
  let middleware: AuthMiddleware;
  let mockJwtService: jest.Mocked<JwtService>;
  let mockRoleRepository: jest.Mocked<IRoleRepository>;
  let mockRes: Response;
  let mockNext: jest.Mock;

  const validRoleId = generateUuid();

  const createMockRequest = (user?: AuthenticatedRequest['user']): AuthenticatedRequest => {
    return { user } as AuthenticatedRequest;
  };

  beforeEach(() => {
    mockJwtService = {
      generateAccessToken: jest.fn(),
      generateRefreshToken: jest.fn(),
      verifyAccessToken: jest.fn(),
      verifyRefreshToken: jest.fn(),
    };

    mockRoleRepository = {
      findById: jest.fn(),
      findByName: jest.fn(),
      findAll: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    mockRes = {} as Response;
    mockNext = jest.fn();

    middleware = new AuthMiddleware(mockJwtService, mockRoleRepository);
  });

  // Debería llamar a next() sin argumentos cuando el rol del usuario está permitido
  it('should call next() when the user role is allowed', async () => {
    mockRoleRepository.findById.mockResolvedValue(new Role(validRoleId, 'ADMIN'));
    const req = createMockRequest({ userId: generateUuid(), roleId: validRoleId, email: 'admin@test.com' });

    await middleware.authorize(['ADMIN'])(req, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalledWith();
    expect(req.user?.roleName).toBe('ADMIN');
  });

  // Debería rechazar con ForbiddenError cuando el rol del usuario no está permitido
  it('should reject with ForbiddenError when the user role is not allowed', async () => {
    mockRoleRepository.findById.mockResolvedValue(new Role(validRoleId, 'CLIENT'));
    const req = createMockRequest({ userId: generateUuid(), roleId: validRoleId, email: 'client@test.com' });

    await middleware.authorize(['ADMIN'])(req, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.any(ForbiddenError));
  });

  // Debería rechazar con UnauthorizedError cuando no hay usuario autenticado en el request
  it('should reject with UnauthorizedError when there is no authenticated user', async () => {
    const req = createMockRequest(undefined);

    await middleware.authorize(['ADMIN'])(req, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    expect(mockRoleRepository.findById).not.toHaveBeenCalled();
  });

  // Debería rechazar con ForbiddenError cuando el roleId no corresponde a ningún rol existente
  it('should reject with ForbiddenError when the roleId does not match any existing role', async () => {
    mockRoleRepository.findById.mockResolvedValue(null);
    const req = createMockRequest({ userId: generateUuid(), roleId: validRoleId, email: 'ghost@test.com' });

    await middleware.authorize(['ADMIN'])(req, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.any(ForbiddenError));
  });

  // La segunda llamada no debe consultar el repositorio (cache en memoria)
  it('should not hit the repository on the second call for the same role', async () => {
    mockRoleRepository.findById.mockResolvedValue(new Role(validRoleId, 'STYLIST'));
    const req1 = createMockRequest({ userId: generateUuid(), roleId: validRoleId, email: 'stylist1@test.com' });
    const req2 = createMockRequest({ userId: generateUuid(), roleId: validRoleId, email: 'stylist2@test.com' });

    await middleware.authorize(['STYLIST'])(req1, mockRes, mockNext);
    await middleware.authorize(['STYLIST'])(req2, mockRes, mockNext);

    expect(mockRoleRepository.findById).toHaveBeenCalledTimes(1);
    expect(mockNext).toHaveBeenNthCalledWith(1);
    expect(mockNext).toHaveBeenNthCalledWith(2);
  });
});
