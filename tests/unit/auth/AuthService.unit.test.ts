import { UserRepository } from '../../../src/modules/auth/domain/repositories/User';
import { RoleRepository } from '../../../src/modules/auth/domain/repositories/Rol';
import { HashService } from '../../../src/modules/auth/application/services/HashService';
import { JwtService } from '../../../src/modules/auth/application/services/JwtService';
import { AuthService } from '../../../src/modules/auth/application/services/AuthService';
import { RoleName } from '@prisma/client';
import { Role } from '../../../src/modules/auth/domain/entities/Role';
import { User } from '../../../src/modules/auth/domain/entities/User';
import { ValidationError } from '../../../src/shared/exceptions/ValidationError';
import { UnauthorizedError } from '../../../src/shared/exceptions/UnauthorizedError';
import { generateUuid } from '../../../src/shared/utils/uuid';
import { ConflictError } from '../../../src/shared/exceptions/ConflictError';

describe('AuthService Unit Tests', () => {
  let authService: AuthService;
  let mockUserRepository: jest.Mocked<UserRepository>;
  let mockRoleRepository: jest.Mocked<RoleRepository>;
  let mockHashService: jest.Mocked<HashService>;
  let mockJwtService: jest.Mocked<JwtService>;

  // Add mocks for use case classes
  let mockLoginUser: any;
  let mockRegisterUser: any;
  let mockRefreshToken: any;
  let mockGetUserProfile: any;
  let mockUpdateUserProfile: any;
  let mockChangeUserPassword: any;

  beforeEach(() => {
    mockUserRepository = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
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

    mockHashService = {
      hash: jest.fn(),
      compare: jest.fn(),
    };

    mockJwtService = {
      generateAccessToken: jest.fn(),
      generateRefreshToken: jest.fn(),
      verifyAccessToken: jest.fn(),
      verifyRefreshToken: jest.fn(),
    };

    // Create simple jest.fn() mocks for each use case dependency
    mockLoginUser = { execute: jest.fn() };
    mockRegisterUser = { execute: jest.fn() };
    mockRefreshToken = { execute: jest.fn() };
    mockGetUserProfile = { execute: jest.fn() };
    mockUpdateUserProfile = { execute: jest.fn() };
    mockChangeUserPassword = { execute: jest.fn() };

    // Pass all 6 required arguments to AuthService
    authService = new AuthService(
      mockLoginUser,
      mockRegisterUser,
      mockRefreshToken,
      mockGetUserProfile,
      mockUpdateUserProfile,
      mockChangeUserPassword,
    );
  });

  describe('login', () => {
    const validLoginDto = {
      email: 'test@example.com',
      password: 'TestPass123!',
    };

    it('should login successfully with valid credentials', async () => {
      const mockRole = Role.create(RoleName.CLIENT);
      const mockUser = User.create(
        mockRole.id, // roleId
        'John Doe',
        'test@example.com',
        '+1234567890',
        'hashedPassword',
      );

      mockUserRepository.findByEmail.mockResolvedValue(mockUser);
      mockHashService.compare.mockResolvedValue(true);
      mockRoleRepository.findById.mockResolvedValue(mockRole);
      mockJwtService.generateAccessToken.mockReturnValue('access-token');
      mockJwtService.generateRefreshToken.mockReturnValue('refresh-token');

      const result = await authService.loginService(validLoginDto);

      expect(result).toHaveProperty('token', 'access-token');
      expect(result).toHaveProperty('refreshToken', 'refresh-token');
      expect(result).toHaveProperty('user');
      expect(result.user.email).toBe('test@example.com');
    });

    it('should throw ValidationError for invalid email', async () => {
      const invalidLoginDto = {
        email: 'invalid-email',
        password: 'TestPass123!',
      };

      await expect(authService.loginService(invalidLoginDto)).rejects.toThrow(ValidationError);
    });

    it('should throw UnauthorizedError for non-existent user', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(null);

      await expect(authService.loginService(validLoginDto)).rejects.toThrow(UnauthorizedError);
    });

    it('should throw UnauthorizedError for invalid password', async () => {
      const mockRole = Role.create(RoleName.CLIENT);
      const mockUser = User.create(
        mockRole.id,
        'John Doe',
        'test@example.com',
        '+1234567890',
        'hashedPassword',
      );

      mockUserRepository.findByEmail.mockResolvedValue(mockUser);
      mockHashService.compare.mockResolvedValue(false);

      await expect(authService.loginService(validLoginDto)).rejects.toThrow(UnauthorizedError);
    });

    it('should throw UnauthorizedError for inactive user', async () => {
      const mockRole = Role.create(RoleName.CLIENT);
      const mockUser = User.create(
        mockRole.id,
        'John Doe',
        'test@example.com',
        '+1234567890',
        'hashedPassword',
      );
      mockUser.deactivate();

      mockUserRepository.findByEmail.mockResolvedValue(mockUser);

      await expect(authService.loginService(validLoginDto)).rejects.toThrow(UnauthorizedError);
    });
  });

  describe('register', () => {
    const validRegisterDto = {
      name: 'John Doe',
      email: 'test@example.com',
      phone: '+1234567890',
      password: 'TestPass123!',
      roleId: generateUuid(),
    };

    it('should register user successfully', async () => {
      const mockRole = Role.create(RoleName.CLIENT);
      const mockUser = User.create(
        validRegisterDto.roleId,
        validRegisterDto.name,
        validRegisterDto.email,
        validRegisterDto.phone,
        'hashedPassword',
      );

      mockUserRepository.existsByEmail.mockResolvedValue(false);
      mockRoleRepository.findById.mockResolvedValue(mockRole);
      mockHashService.hash.mockResolvedValue('hashedPassword');
      mockUserRepository.save.mockResolvedValue(mockUser);

      const result = await authService.registerService(validRegisterDto);

      expect(result.email).toBe(validRegisterDto.email);
      expect(result.name).toBe(validRegisterDto.name);
      expect(mockUserRepository.save).toHaveBeenCalled();
    });

    it('should throw ConflictError for existing email', async () => {
      mockUserRepository.existsByEmail.mockResolvedValue(true);

      await expect(authService.registerService(validRegisterDto)).rejects.toThrow(ConflictError);
    });

    it('should throw ValidationError for invalid email', async () => {
      const invalidRegisterDto = {
        ...validRegisterDto,
        email: 'invalid-email',
      };

      await expect(authService.registerService(invalidRegisterDto)).rejects.toThrow(
        ValidationError,
      );
    });

    it('should throw ValidationError for weak password', async () => {
      const invalidRegisterDto = {
        ...validRegisterDto,
        password: '123',
      };

      await expect(authService.registerService(invalidRegisterDto)).rejects.toThrow(
        ValidationError,
      );
    });
  });

  describe('refreshToken', () => {
    it('should refresh token with valid refresh token', async () => {
      const mockUser = User.create(
        generateUuid(),
        'John Doe',
        'test@example.com',
        '+1234567890',
        'hashedPassword',
      );
      const mockRole = Role.create(RoleName.CLIENT);

      const mockPayload = {
        userId: mockUser.id,
        roleId: mockRole.id,
        email: mockUser.email,
      };

      mockJwtService.verifyRefreshToken.mockReturnValue(mockPayload);
      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockRoleRepository.findById.mockResolvedValue(mockRole);
      mockJwtService.generateAccessToken.mockReturnValue('new-access-token');
      mockJwtService.generateRefreshToken.mockReturnValue('new-refresh-token');

      const result = await authService.refreshTokenService('valid-refresh-token');

      expect(result).toHaveProperty('token', 'new-access-token');
      expect(result).toHaveProperty('refreshToken', 'new-refresh-token');
      expect(result).toHaveProperty('user');
    });

    it('should throw UnauthorizedError for invalid refresh token', async () => {
      mockJwtService.verifyRefreshToken.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(authService.refreshTokenService('invalid-token')).rejects.toThrow(
        UnauthorizedError,
      );
    });
  });

  describe('getUserProfile', () => {
    it('should return user profile successfully', async () => {
      const mockUser = User.create(
        generateUuid(),
        'John Doe',
        'test@example.com',
        '+1234567890',
        'hashedPassword',
      );
      const mockRole = Role.create(RoleName.CLIENT);

      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockRoleRepository.findById.mockResolvedValue(mockRole);

      const result = await authService.getUserProfileService(mockUser.id);

      expect(result.email).toBe('test@example.com');
      expect(result.name).toBe('John Doe');
      expect(result.role.name).toBe(RoleName.CLIENT);
    });

    it('should throw NotFoundError for non-existent user', async () => {
      mockUserRepository.findById.mockResolvedValue(null);

      await expect(authService.getUserProfileService('non-existent-id')).rejects.toThrow(
        'User not found',
      );
    });
  });

  describe('updateProfile', () => {
    it('should update user profile successfully', async () => {
      const mockUser = User.create(
        generateUuid(),
        'John Doe',
        'test@example.com',
        '+1234567890',
        'hashedPassword',
      );
      const mockRole = Role.create(RoleName.CLIENT);

      const updateDto = {
        name: 'Jane Doe',
        phone: '+0987654321',
      };

      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockUserRepository.update.mockResolvedValue(mockUser);
      mockRoleRepository.findById.mockResolvedValue(mockRole);

      const result = await authService.updateProfileService(mockUser.id, updateDto);

      expect(result.name).toBe('Jane Doe');
      expect(mockUserRepository.update).toHaveBeenCalled();
    });
  });

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      const mockUser = User.create(
        generateUuid(),
        'John Doe',
        'test@example.com',
        '+1234567890',
        'hashedPassword',
      );

      const changePasswordDto = {
        currentPassword: 'OldPass123!',
        newPassword: 'NewPass123!',
      };

      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockHashService.compare.mockResolvedValue(true);
      mockHashService.hash.mockResolvedValue('newHashedPassword');
      mockUserRepository.update.mockResolvedValue(mockUser);

      await authService.changePasswordService(mockUser.id, changePasswordDto);

      expect(mockHashService.compare).toHaveBeenCalledWith('OldPass123!', 'hashedPassword');
      expect(mockHashService.hash).toHaveBeenCalledWith('NewPass123!');
      expect(mockUserRepository.update).toHaveBeenCalled();
    });

    it('should throw UnauthorizedError for incorrect current password', async () => {
      const mockUser = User.create(
        generateUuid(),
        'John Doe',
        'test@example.com',
        '+1234567890',
        'hashedPassword',
      );

      const changePasswordDto = {
        currentPassword: 'WrongPass123!',
        newPassword: 'NewPass123!',
      };

      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockHashService.compare.mockResolvedValue(false);

      await expect(
        authService.changePasswordService(mockUser.id, changePasswordDto),
      ).rejects.toThrow(UnauthorizedError);
    });
  });
});
