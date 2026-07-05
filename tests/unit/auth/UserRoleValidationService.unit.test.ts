import { RoleName } from '@prisma/client';
import { UserRoleValidationService } from '../../../src/modules/auth/domain/services/UserRoleValidationService';
import { IUserRepository } from '../../../src/modules/auth/domain/repositories/IUserRepository';
import { NotFoundError } from '../../../src/shared/exceptions/NotFoundError';
import { BusinessRuleError } from '../../../src/shared/exceptions/BusinessRuleError';

describe('UserRoleValidationService', () => {
  let service: UserRoleValidationService;
  let mockUserRepository: jest.Mocked<IUserRepository>;

  const validUserId = 'user-123';

  const createMockUserWithRole = (roleName: RoleName): any => ({
    id: validUserId,
    roleId: 'role-id',
    name: 'Test User',
    email: 'test@example.com',
    phone: '+1234567890',
    password: 'hashed',
    isActive: true,
    role: { id: 'role-id', name: roleName, description: 'Test role' },
  });

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
    } as unknown as jest.Mocked<IUserRepository>;

    service = new UserRoleValidationService(mockUserRepository);
  });

  describe('ensureUserHasRole', () => {
    // Debería resolver sin error cuando el usuario existe y tiene el rol esperado
    it('should resolve without error when user exists with the expected role', async () => {
      mockUserRepository.findByIdWithRole.mockResolvedValue(
        createMockUserWithRole(RoleName.STYLIST),
      );

      await expect(
        service.ensureUserHasRole(validUserId, RoleName.STYLIST),
      ).resolves.toBeUndefined();
      expect(mockUserRepository.findByIdWithRole).toHaveBeenCalledWith(validUserId);
    });

    // Debería funcionar igual para los 3 roles del sistema
    it.each([RoleName.ADMIN, RoleName.CLIENT, RoleName.STYLIST])(
      'should resolve without error for role %s',
      async (roleName) => {
        mockUserRepository.findByIdWithRole.mockResolvedValue(createMockUserWithRole(roleName));

        await expect(service.ensureUserHasRole(validUserId, roleName)).resolves.toBeUndefined();
      },
    );

    // Debería lanzar NotFoundError con el label capitalizado del rol cuando el usuario no existe
    it('should throw NotFoundError with capitalized role label when user does not exist', async () => {
      mockUserRepository.findByIdWithRole.mockResolvedValue(null);

      await expect(service.ensureUserHasRole(validUserId, RoleName.STYLIST)).rejects.toThrow(
        new NotFoundError('Stylist', validUserId),
      );
    });

    // Debería capitalizar correctamente cada rol en el mensaje de NotFoundError
    it.each([
      [RoleName.ADMIN, 'Admin'],
      [RoleName.CLIENT, 'Client'],
      [RoleName.STYLIST, 'Stylist'],
    ])('should capitalize %s as %s in NotFoundError', async (roleName, expectedLabel) => {
      mockUserRepository.findByIdWithRole.mockResolvedValue(null);

      await expect(service.ensureUserHasRole(validUserId, roleName)).rejects.toThrow(
        new NotFoundError(expectedLabel, validUserId),
      );
    });

    // Debería lanzar BusinessRuleError cuando el usuario existe pero tiene otro rol
    it('should throw BusinessRuleError when user exists with a different role', async () => {
      mockUserRepository.findByIdWithRole.mockResolvedValue(
        createMockUserWithRole(RoleName.CLIENT),
      );

      await expect(service.ensureUserHasRole(validUserId, RoleName.STYLIST)).rejects.toThrow(
        new BusinessRuleError('The specified user is not a stylist'),
      );
    });

    // Debería lanzar BusinessRuleError si el usuario no tiene rol asociado (dato corrupto)
    it('should throw BusinessRuleError when user has no role attached', async () => {
      const userWithoutRole = { ...createMockUserWithRole(RoleName.STYLIST), role: null };
      mockUserRepository.findByIdWithRole.mockResolvedValue(userWithoutRole);

      await expect(service.ensureUserHasRole(validUserId, RoleName.STYLIST)).rejects.toThrow(
        BusinessRuleError,
      );
    });
  });
});
