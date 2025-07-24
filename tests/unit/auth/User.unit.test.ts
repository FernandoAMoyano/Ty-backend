import { User } from '../../../src/modules/auth/domain/entities/User';
import { generateUuid } from '../../../src/shared/utils/uuid';
describe('User Entity', () => {
  const validUserData = {
    id: generateUuid(),
    roleId: generateUuid(),
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+1234567890',
    password: 'hashedPassword123',
    isActive: true,
  };

  describe('User Creation', () => {
    // Debería crear usuario con datos válidos
    it('should create user with valid data', () => {
      const user = new User(
        validUserData.id,
        validUserData.roleId,
        validUserData.name,
        validUserData.email,
        validUserData.phone,
        validUserData.password,
        validUserData.isActive,
      );

      expect(user.id).toBe(validUserData.id);
      expect(user.name).toBe(validUserData.name);
      expect(user.email).toBe(validUserData.email);
      expect(user.isActive).toBe(true);
    });

    // Debería crear usuario con método estático create
    it('should create user with static create method', () => {
      const user = User.create(
        validUserData.roleId,
        validUserData.name,
        validUserData.email,
        validUserData.phone,
        validUserData.password,
      );

      expect(user.name).toBe(validUserData.name);
      expect(user.email).toBe(validUserData.email);
      expect(user.isActive).toBe(true);
      expect(user.id).toBeDefined();
    });
  });

  describe('User State Management', () => {
    let user: User;

    beforeEach(() => {
      user = new User(
        validUserData.id,
        validUserData.roleId,
        validUserData.name,
        validUserData.email,
        validUserData.phone,
        validUserData.password,
        validUserData.isActive,
      );
    });

    // Debería activar usuario
    it('should activate user', () => {
      user.deactivate();
      expect(user.isActive).toBe(false);

      user.activate();
      expect(user.isActive).toBe(true);
    });

    // Debería desactivar usuario
    it('should deactivate user', () => {
      user.activate();
      expect(user.isActive).toBe(true);

      user.deactivate();
      expect(user.isActive).toBe(false);
    });

    // Debería actualizar información del perfil
    it('should update profile information', () => {
      const newName = 'Jane Doe';
      const newPhone = '+9876543210';
      const newProfilePicture = 'https://example.com/photo.jpg';

      user.updateProfile(newName, newPhone, newProfilePicture);

      expect(user.name).toBe(newName);
      expect(user.phone).toBe(newPhone);
      expect(user.profilePicture).toBe(newProfilePicture);
    });

    // Debería actualizar contraseña
    it('should update password', () => {
      const newHashedPassword = 'newHashedPassword456';
      const originalUpdatedAt = user.updatedAt;

      //garantizar la diferencia de marca de tiempo
      setTimeout(() => {
        user.updatePassword(newHashedPassword);
        expect(user.password).toBe(newHashedPassword);
        expect(user.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
      }, 10);
    });
  });

  describe('User Validation', () => {
    // Debería lanzar error para nombre vacío
    it('should throw error for empty name', () => {
      expect(() => {
        new User(
          validUserData.id,
          validUserData.roleId,
          '', // nombre vacío
          validUserData.email,
          validUserData.phone,
          validUserData.password,
          validUserData.isActive,
        );
      }).toThrow('User name cannot be empty');
    });

    // Debería lanzar error para teléfono inválido
    it('should throw error for invalid phone', () => {
      expect(() => {
        new User(
          validUserData.id,
          validUserData.roleId,
          validUserData.name,
          validUserData.email,
          'invalid-phone', // Teléfono no válido
          validUserData.password,
          validUserData.isActive,
        );
      }).toThrow('Invalid phone format');
    });

    // Debería lanzar error para teléfono vacío
    it('should throw error for empty phone', () => {
      expect(() => {
        new User(
          validUserData.id,
          validUserData.roleId,
          validUserData.name,
          validUserData.email,
          '', // teléfono vacío
          validUserData.password,
          validUserData.isActive,
        );
      }).toThrow('Phone cannot be empty');
    });
  });
});
