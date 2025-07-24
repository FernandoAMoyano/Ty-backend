import { BcryptHashService } from '../../../src/modules/auth/infrastructure/services/BcryptHashService';
describe('BcryptHashService Unit Tests', () => {
  let hashService: BcryptHashService;

  beforeEach(() => {
    hashService = new BcryptHashService();
  });

  describe('hash', () => {
    // Debería hashear la contraseña exitosamente
    it('should hash password successfully', async () => {
      const plainPassword = 'TestPassword123!';
      const hashedPassword = await hashService.hash(plainPassword);

      expect(hashedPassword).toBeDefined();
      expect(hashedPassword).not.toBe(plainPassword);
      expect(hashedPassword.length).toBeGreaterThan(50);
    });

    // Debería generar diferentes hashes para la misma contraseña
    it('should generate different hashes for same password', async () => {
      const plainPassword = 'TestPassword123!';
      const hash1 = await hashService.hash(plainPassword);
      const hash2 = await hashService.hash(plainPassword);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('compare', () => {
    // Debería devolver true para contraseña correcta
    it('should return true for correct password', async () => {
      const plainPassword = 'TestPassword123!';
      const hashedPassword = await hashService.hash(plainPassword);

      const isValid = await hashService.compare(plainPassword, hashedPassword);

      expect(isValid).toBe(true);
    });

    // Debería devolver false para contraseña incorrecta
    it('should return false for incorrect password', async () => {
      const plainPassword = 'TestPassword123!';
      const wrongPassword = 'WrongPassword456!';
      const hashedPassword = await hashService.hash(plainPassword);

      const isValid = await hashService.compare(wrongPassword, hashedPassword);

      expect(isValid).toBe(false);
    });

    // Debería devolver false para hash mal formado
    it('should return false for malformed hash', async () => {
      const plainPassword = 'TestPassword123!';
      const malformedHash = 'not-a-valid-hash';

      const isValid = await hashService.compare(plainPassword, malformedHash);

      expect(isValid).toBe(false);
    });
  });
});
