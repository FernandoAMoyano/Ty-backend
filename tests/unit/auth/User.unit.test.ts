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

    // Debería no exponer un método updatePreferences (AUTH-31, código muerto eliminado)
    // (updatePreferences() no tenía caso de uso/endpoint asociado)
    it('should not expose an updatePreferences method (AUTH-31, removed dead code)', () => {
      expect((user as any).updatePreferences).toBeUndefined();
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

    // Debería lanzar error para nombre de más de 100 caracteres
    // (endurecimiento de dominio: aplica aunque la entidad se instancie fuera del flujo HTTP)
    it('should throw error for name longer than 100 characters', () => {
      expect(() => {
        new User(
          validUserData.id,
          validUserData.roleId,
          'a'.repeat(101),
          validUserData.email,
          validUserData.phone,
          validUserData.password,
          validUserData.isActive,
        );
      }).toThrow('User name cannot exceed 100 characters');
    });

    // Debería lanzar error para una URL de foto de perfil inválida
    // (endurecimiento de dominio: profilePicture debe ser una URL válida si se proporciona)
    it('should throw error for invalid profile picture URL', () => {
      expect(() => {
        new User(
          validUserData.id,
          validUserData.roleId,
          validUserData.name,
          validUserData.email,
          validUserData.phone,
          validUserData.password,
          validUserData.isActive,
          'not-a-url',
        );
      }).toThrow('Profile picture must be a valid URL');
    });

    // Debería aceptar una URL de foto de perfil válida
    it('should accept a valid profile picture URL', () => {
      const user = new User(
        validUserData.id,
        validUserData.roleId,
        validUserData.name,
        validUserData.email,
        validUserData.phone,
        validUserData.password,
        validUserData.isActive,
        'https://example.com/photo.jpg',
      );
      expect(user.profilePicture).toBe('https://example.com/photo.jpg');
    });

    // Debería permitir omitir profilePicture (opcional)
    it('should allow omitting profilePicture', () => {
      const user = new User(
        validUserData.id,
        validUserData.roleId,
        validUserData.name,
        validUserData.email,
        validUserData.phone,
        validUserData.password,
        validUserData.isActive,
      );
      expect(user.profilePicture).toBeUndefined();
    });
  });

  describe('Domain Hardening - updateProfile', () => {
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

    // Debería lanzar error al actualizar el nombre a más de 100 caracteres
    it('should throw error when updating name to longer than 100 characters', () => {
      expect(() => {
        user.updateProfile('a'.repeat(101));
      }).toThrow('User name cannot exceed 100 characters');
    });

    // Debería lanzar error al actualizar profilePicture con una URL inválida
    it('should throw error when updating profilePicture to an invalid URL', () => {
      expect(() => {
        user.updateProfile(undefined, undefined, 'not-a-url');
      }).toThrow('Profile picture must be a valid URL');
    });

    // Debería aceptar actualizar profilePicture con una URL válida
    it('should accept updating profilePicture to a valid URL', () => {
      user.updateProfile(undefined, undefined, 'https://example.com/new-photo.jpg');
      expect(user.profilePicture).toBe('https://example.com/new-photo.jpg');
    });
  });
});
