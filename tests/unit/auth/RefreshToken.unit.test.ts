import { RoleName } from '@prisma/client';
import { RefreshToken } from '../../../src/modules/auth/application/use-cases/RefreshToken';
import { JwtService, JwtPayload } from '../../../src/modules/auth/application/services/JwtService';
import { IUserRepository } from '../../../src/modules/auth/domain/repositories/IUserRepository';
import { IRoleRepository } from '../../../src/modules/auth/domain/repositories/IRoleRepository';
import { User } from '../../../src/modules/auth/domain/entities/User';
import { Role } from '../../../src/modules/auth/domain/entities/Role';
import { UnauthorizedError } from '../../../src/shared/exceptions/UnauthorizedError';
import { NotFoundError } from '../../../src/shared/exceptions/NotFoundError';

describe('RefreshToken Use Case', () => {
  let refreshToken: RefreshToken;
  let mockUserRepository: jest.Mocked<IUserRepository>;
  let mockRoleRepository: jest.Mocked<IRoleRepository>;
  let mockJwtService: jest.Mocked<JwtService>;

  const validPayload: JwtPayload = {
    userId: 'user-id',
    roleId: 'role-id',
    email: 'test@example.com',
  };

  const activeUser = new User(
    'user-id',
    'role-id',
    'Test User',
    'test@example.com',
    '+1234567890',
    'hashed-password',
    true,
  );

  const clientRole = Role.fromPersistence('role-id', RoleName.CLIENT, 'Cliente');

  beforeEach(() => {
    mockUserRepository = {
      findById: jest.fn(),
      findByIdWithRole: jest.fn(),
      findByEmail: jest.fn(),
      findByEmailWithRole: jest.fn(),
      existsByEmail: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findAll: jest.fn(),
      findByRole: jest.fn(),
    };

    mockRoleRepository = {
      findById: jest.fn(),
      findByName: jest.fn(),
      findAll: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    mockJwtService = {
      generateAccessToken: jest.fn(),
      generateRefreshToken: jest.fn(),
      verifyAccessToken: jest.fn(),
      verifyRefreshToken: jest.fn(),
    };

    refreshToken = new RefreshToken(mockUserRepository, mockRoleRepository, mockJwtService);
  });

  // Debería renovar los tokens exitosamente con datos válidos
  it('should refresh tokens successfully with valid data', async () => {
    mockJwtService.verifyRefreshToken.mockReturnValue(validPayload);
    mockUserRepository.findById.mockResolvedValue(activeUser);
    mockRoleRepository.findById.mockResolvedValue(clientRole);
    mockJwtService.generateAccessToken.mockReturnValue('new-access-token');
    mockJwtService.generateRefreshToken.mockReturnValue('new-refresh-token');

    const result = await refreshToken.execute('valid-refresh-token');

    expect(result.token).toBe('new-access-token');
    expect(result.refreshToken).toBe('new-refresh-token');
    expect(result.user.id).toBe(activeUser.id);
  });

  // Debería lanzar UnauthorizedError si el refresh token es inválido (propagado desde JwtTokenService)
  it('should throw UnauthorizedError when the refresh token itself is invalid', async () => {
    mockJwtService.verifyRefreshToken.mockImplementation(() => {
      throw new UnauthorizedError('Invalid refresh token');
    });

    await expect(refreshToken.execute('bad-token')).rejects.toThrow(UnauthorizedError);
  });

  // Debería lanzar UnauthorizedError si el usuario no existe
  it('should throw UnauthorizedError when user does not exist', async () => {
    mockJwtService.verifyRefreshToken.mockReturnValue(validPayload);
    mockUserRepository.findById.mockResolvedValue(null);

    await expect(refreshToken.execute('valid-refresh-token')).rejects.toThrow(UnauthorizedError);
  });

  // Debería lanzar UnauthorizedError si el usuario está inactivo
  it('should throw UnauthorizedError when user is inactive', async () => {
    const inactiveUser = new User(
      'user-id',
      'role-id',
      'Test User',
      'test@example.com',
      '+1234567890',
      'hashed-password',
      false,
    );
    mockJwtService.verifyRefreshToken.mockReturnValue(validPayload);
    mockUserRepository.findById.mockResolvedValue(inactiveUser);

    await expect(refreshToken.execute('valid-refresh-token')).rejects.toThrow(UnauthorizedError);
  });

  // No debería convertir errores de base de datos en 401
  it('should not convert database errors into 401', async () => {
    mockJwtService.verifyRefreshToken.mockReturnValue(validPayload);
    mockUserRepository.findById.mockRejectedValue(new Error('db down'));

    let caughtError: unknown;
    try {
      await refreshToken.execute('valid-refresh-token');
    } catch (error) {
      caughtError = error;
    }

    expect(caughtError).toBeDefined();
    expect(caughtError).not.toBeInstanceOf(UnauthorizedError);
    expect((caughtError as Error).message).toBe('db down');
  });

  // Debería propagar NotFoundError si el rol no existe
  it('should propagate NotFoundError when role is missing', async () => {
    mockJwtService.verifyRefreshToken.mockReturnValue(validPayload);
    mockUserRepository.findById.mockResolvedValue(activeUser);
    mockRoleRepository.findById.mockResolvedValue(null);

    await expect(refreshToken.execute('valid-refresh-token')).rejects.toThrow(NotFoundError);
  });
});
