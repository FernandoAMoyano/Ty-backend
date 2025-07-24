import { generateUuid } from '../../../src/shared/utils/uuid';
import { Role } from '../../../src/modules/auth/domain/entities/Role';
import { RoleName } from '@prisma/client';

describe('Role Entity', () => {
  describe('Role Creation', () => {
    // Debería crear rol con datos válidos
    it('should create role with valid data', () => {
      const roleId = generateUuid();
      const role = new Role(roleId, RoleName.ADMIN, 'Administrator role');

      expect(role.id).toBe(roleId);
      expect(role.name).toBe(RoleName.ADMIN);
      expect(role.description).toBe('Administrator role');
    });

    // Debería crear rol con método estático create
    it('should create role with static create method', () => {
      const role = Role.create(RoleName.CLIENT, 'Client role');

      expect(role.name).toBe(RoleName.CLIENT);
      expect(role.description).toBe('Client role');
      expect(role.id).toBeDefined();
    });

    // Debería crear rol sin descripción
    it('should create role without description', () => {
      const role = Role.create(RoleName.STYLIST);

      expect(role.name).toBe(RoleName.STYLIST);
      expect(role.description).toBeUndefined();
    });
  });

  describe('Role Type Checking', () => {
    // Debería identificar correctamente el rol de administrador
    it('should correctly identify admin role', () => {
      const adminRole = Role.create(RoleName.ADMIN);

      expect(adminRole.isAdmin()).toBe(true);
      expect(adminRole.isStylist()).toBe(false);
      expect(adminRole.isClient()).toBe(false);
    });

    // Debería identificar correctamente el rol de estilista
    it('should correctly identify stylist role', () => {
      const stylistRole = Role.create(RoleName.STYLIST);

      expect(stylistRole.isAdmin()).toBe(false);
      expect(stylistRole.isStylist()).toBe(true);
      expect(stylistRole.isClient()).toBe(false);
    });

    // Debería identificar correctamente el rol de cliente
    it('should correctly identify client role', () => {
      const clientRole = Role.create(RoleName.CLIENT);

      expect(clientRole.isAdmin()).toBe(false);
      expect(clientRole.isStylist()).toBe(false);
      expect(clientRole.isClient()).toBe(true);
    });
  });

  describe('Role Persistence', () => {
    // Debería convertir a formato de persistencia correctamente
    it('should convert to persistence format correctly', () => {
      const role = Role.create(RoleName.ADMIN, 'Admin description');
      const persistenceData = role.toPersistence();

      expect(persistenceData).toHaveProperty('id');
      expect(persistenceData).toHaveProperty('name', RoleName.ADMIN);
      expect(persistenceData).toHaveProperty('description', 'Admin description');
      expect(persistenceData).toHaveProperty('createdAt');
    });
  });
});
