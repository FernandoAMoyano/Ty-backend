import { Stylist } from '../../../src/modules/services/domain/entities/Stylist';
import { ValidationError } from '../../../src/shared/exceptions/ValidationError';

describe('Stylist Entity', () => {
  describe('Creation', () => {
    // Debería crear estilista con datos válidos
    it('should create stylist with valid data', () => {
      const stylist = Stylist.create('user-id-123');

      expect(stylist.id).toBeDefined();
      expect(stylist.userId).toBe('user-id-123');
      expect(stylist.createdAt).toBeInstanceOf(Date);
      expect(stylist.updatedAt).toBeInstanceOf(Date);
    });

    // Debería lanzar error si userId está vacío
    it('should throw error if userId is empty', () => {
      expect(() => {
        Stylist.create('');
      }).toThrow(ValidationError);
    });

    // Debería lanzar error si userId son espacios en blanco
    it('should throw error if userId is whitespace', () => {
      expect(() => {
        Stylist.create('   ');
      }).toThrow(ValidationError);
    });
  });

  describe('fromPersistence', () => {
    // Debería crear estilista desde datos de persistencia
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
    // Debería actualizar marcas de tiempo
    it('should update timestamps', () => {
      // Usar fake timers de Jest para control preciso del tiempo
      jest.useFakeTimers();
      const initialTime = new Date('2024-06-15T10:00:00.000Z');
      jest.setSystemTime(initialTime);

      const stylist = Stylist.create('user-id-123');
      const originalUpdatedAt = stylist.updatedAt;

      // Avanzar el tiempo 1 segundo
      jest.advanceTimersByTime(1000);

      stylist.updateInfo();

      expect(stylist.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());

      // Restaurar timers reales
      jest.useRealTimers();
    });
  });

  describe('toPersistence', () => {
    // Debería devolver objeto de persistencia
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
