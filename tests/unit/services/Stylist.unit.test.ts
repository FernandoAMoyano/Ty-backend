import { Stylist } from '../../../src/modules/services/domain/entities/Stylist';
import { ValidationError } from '../../../src/shared/exceptions/ValidationError';

describe('Stylist Entity', () => {
  describe('Creation', () => {
    it('should create stylist with valid data', () => {
      const stylist = Stylist.create('user-id-123');

      expect(stylist.id).toBeDefined();
      expect(stylist.userId).toBe('user-id-123');
      expect(stylist.createdAt).toBeInstanceOf(Date);
      expect(stylist.updatedAt).toBeInstanceOf(Date);
    });

    it('should throw error if userId is empty', () => {
      expect(() => {
        Stylist.create('');
      }).toThrow(ValidationError);
    });

    it('should throw error if userId is whitespace', () => {
      expect(() => {
        Stylist.create('   ');
      }).toThrow(ValidationError);
    });
  });

  describe('fromPersistence', () => {
    it('should create stylist from persistence data', () => {
      const createdAt = new Date('2024-01-01');
      const updatedAt = new Date('2024-01-02');

      const stylist = Stylist.fromPersistence('stylist-id', 'user-id-123', createdAt, updatedAt);

      expect(stylist.id).toBe('stylist-id');
      expect(stylist.userId).toBe('user-id-123');
      expect(stylist.createdAt).toBe(createdAt);
      expect(stylist.updatedAt).toBe(updatedAt);
    });
  });

  describe('updateInfo', () => {
    it('should update timestamps', async () => {
      const stylist = Stylist.create('user-id-123');
      const originalUpdatedAt = stylist.updatedAt;

      await new Promise((resolve) => setTimeout(resolve, 1));

      stylist.updateInfo();

      expect(stylist.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });

  describe('toPersistence', () => {
    it('should return persistence object', () => {
      const stylist = Stylist.create('user-id-123');
      const persistence = stylist.toPersistence();

      expect(persistence).toEqual({
        id: stylist.id,
        userId: stylist.userId,
        createdAt: stylist.createdAt,
        updatedAt: stylist.updatedAt,
      });
    });
  });
});
