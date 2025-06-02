import { generateUuid } from '../../../src/shared/utils/uuid';
import { Role } from '../../../src/modules/auth/domain/entities/Role';
import { RoleName } from '@prisma/client';

describe('Role Entity', () => {
  describe('Role Creation', () => {
    it('should create role with valid data', () => {
      const roleId = generateUuid();
      const role = new Role(roleId, RoleName.ADMIN, 'Administrator role');

      expect(role.id).toBe(roleId);
      expect(role.name).toBe(RoleName.ADMIN);
      expect(role.description).toBe('Administrator role');
    });

    it('should create role with static create method', () => {
      const role = Role.create(RoleName.CLIENT, 'Client role');

      expect(role.name).toBe(RoleName.CLIENT);
      expect(role.description).toBe('Client role');
      expect(role.id).toBeDefined();
    });

    it('should create role without description', () => {
      const role = Role.create(RoleName.STYLIST);

      expect(role.name).toBe(RoleName.STYLIST);
      expect(role.description).toBeUndefined();
    });
  });

  describe('Role Type Checking', () => {
    it('should correctly identify admin role', () => {
      const adminRole = Role.create(RoleName.ADMIN);

      expect(adminRole.isAdmin()).toBe(true);
      expect(adminRole.isStylist()).toBe(false);
      expect(adminRole.isClient()).toBe(false);
      //expect(adminRole.isReceptionist()).toBe(false);
    });

    it('should correctly identify stylist role', () => {
      const stylistRole = Role.create(RoleName.STYLIST);

      expect(stylistRole.isAdmin()).toBe(false);
      expect(stylistRole.isStylist()).toBe(true);
      expect(stylistRole.isClient()).toBe(false);
      //expect(stylistRole.isReceptionist()).toBe(false);
    });

    it('should correctly identify client role', () => {
      const clientRole = Role.create(RoleName.CLIENT);

      expect(clientRole.isAdmin()).toBe(false);
      expect(clientRole.isStylist()).toBe(false);
      expect(clientRole.isClient()).toBe(true);
      //expect(clientRole.isReceptionist()).toBe(false);
    });

    /*  it('should correctly identify receptionist role', () => {
      const receptionistRole = Role.create(RoleName.RECEPTIONIST);

      expect(receptionistRole.isAdmin()).toBe(false);
      expect(receptionistRole.isStylist()).toBe(false);
      expect(receptionistRole.isClient()).toBe(false);
      expect(receptionistRole.isReceptionist()).toBe(true);
    }); */
  });

  describe('Role Persistence', () => {
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
